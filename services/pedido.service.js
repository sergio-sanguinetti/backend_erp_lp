const { prisma } = require('../config/database');
const { getMexicoCityDayBounds, getNowMexico, getTodayDateMexico } = require('../utils/timezoneMexico');

// Generar número de pedido único (usa el máximo del día + 1 para evitar colisiones por concurrencia)
const generarNumeroPedido = async () => {
  const dateStr = getTodayDateMexico();
  const prefix = `PED-${dateStr.replace(/-/g, '')}-`;

  const ultimo = await prisma.pedido.findFirst({
    where: { numeroPedido: { startsWith: prefix } },
    orderBy: { numeroPedido: 'desc' },
    select: { numeroPedido: true }
  });

  const siguiente = ultimo
    ? parseInt(ultimo.numeroPedido.slice(prefix.length), 10) + 1
    : 1;
  return prefix + String(siguiente).padStart(4, '0');
};

// Obtener todos los pedidos con filtros
exports.getAllPedidos = async (filtros = {}) => {
  const where = {};
  
  // Fechas: día en Ciudad de México. Incluir también medianoche UTC del mismo día por si la BD guardó "YYYY-MM-DD 00:00:00" en UTC.
  if (filtros.fechaDesde) {
    const trimmed = String(filtros.fechaDesde).trim().slice(0, 10);
    const { start: startMexico } = getMexicoCityDayBounds(trimmed);
    const startUTC = new Date(`${trimmed}T00:00:00.000Z`);
    const start = startUTC < startMexico ? startUTC : startMexico;
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: start
    };
  }
  if (filtros.fechaHasta) {
    const { end } = getMexicoCityDayBounds(filtros.fechaHasta);
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: end
    };
  }
  
  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }
  
  if (filtros.estado) {
    where.estado = filtros.estado;
  }
  
  if (filtros.tipoServicio) {
    where.tipoServicio = filtros.tipoServicio;
  }
  
  if (filtros.repartidorId) {
    where.repartidorId = filtros.repartidorId;
  }
  
  if (filtros.sedeId) {
    where.sedeId = filtros.sedeId;
  }

  if (filtros.rutaId) {
    where.rutaId = filtros.rutaId;
  }
  
  console.log('Query where clause:', JSON.stringify(where, null, 2));
  
  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          email: true,
          telefono: true,
          calle: true,
          numeroExterior: true,
          numeroInterior: true,
          colonia: true,
          municipio: true,
          estado: true,
          codigoPostal: true,
          domicilios: {
            where: {
              activo: {
                not: false
              }
            },
            select: {
              id: true,
              tipo: true,
              calle: true,
              numeroExterior: true,
              numeroInterior: true,
              colonia: true,
              municipio: true,
              estado: true,
              codigoPostal: true,
              referencia: true,
              latitud: true,
              longitud: true,
              activo: true,
              codigoQR: true
            }
          }
        }
      },
      ruta: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      },
      repartidor: {
        select: {
          id: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          email: true,
          telefono: true
        }
      },
      sede: {
        select: {
          id: true,
          nombre: true
        }
      },
      productosPedido: {
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              categoriaId: true,
              precio: true,
              unidad: true,
              categoria: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true
                }
              }
            }
          }
        }
      },
      pagos: {
        include: {
          metodo: true
        },
        orderBy: {
          fecha: 'desc'
        }
      }
    },
    orderBy: { fechaCreacion: 'desc' }
  });
  
  // Parsear campos JSON que se guardan como string
  const pedidosFormateados = pedidos.map(pedido => {
    if (pedido.calculoPipas && typeof pedido.calculoPipas === 'string') {
      try {
        pedido.calculoPipas = JSON.parse(pedido.calculoPipas);
      } catch (e) {
        console.error('Error parsing calculoPipas:', e);
      }
    }
    if (pedido.formasPago && typeof pedido.formasPago === 'string') {
      try {
        pedido.formasPago = JSON.parse(pedido.formasPago);
      } catch (e) {
        console.error('Error parsing formasPago:', e);
      }
    }
    return pedido;
  });
  
  console.log('Pedidos encontrados en DB:', pedidosFormateados.length);
  if (pedidosFormateados.length > 0) {
    console.log('Primer pedido:', { id: pedidosFormateados[0].id, numeroPedido: pedidosFormateados[0].numeroPedido, sedeId: pedidosFormateados[0].sedeId });
  }
  
  return pedidosFormateados;
};

// Obtener pedido por ID
exports.findPedidoById = async (id) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      ruta: true,
      repartidor: true,
      sede: true,
      productosPedido: {
        include: {
          producto: true
        }
      },
      pagos: {
        include: {
          metodo: true
        },
        orderBy: {
          fecha: 'desc'
        }
      }
    }
  });

  if (pedido) {
    if (pedido.calculoPipas && typeof pedido.calculoPipas === 'string') {
      try {
        pedido.calculoPipas = JSON.parse(pedido.calculoPipas);
      } catch (e) {
        console.error('Error parsing calculoPipas:', e);
      }
    }
    if (pedido.formasPago && typeof pedido.formasPago === 'string') {
      try {
        pedido.formasPago = JSON.parse(pedido.formasPago);
      } catch (e) {
        console.error('Error parsing formasPago:', e);
      }
    }
  }

  return pedido;
};

// Crear nuevo pedido
exports.createPedido = async (pedidoData) => {
  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: pedidoData.clienteId }
  });
  
  if (!cliente) {
    const error = new Error('El cliente especificado no existe.');
    error.status = 404;
    throw error;
  }
  
  // Obtener la ruta del cliente si no se proporciona
  const rutaId = pedidoData.rutaId || cliente.rutaId;
  
  // Verificar que el repartidor existe si se proporciona
  if (pedidoData.repartidorId) {
    const repartidor = await prisma.usuario.findUnique({
      where: { id: pedidoData.repartidorId }
    });
    
    if (!repartidor) {
      const error = new Error('El repartidor especificado no existe.');
      error.status = 404;
      throw error;
    }
  }
  
  // Fecha y hora en Ciudad de México (America/Mexico_City, UTC-6)
  const nowMexico = getNowMexico();
  let fechaPedido;
  let horaPedido = pedidoData.horaPedido || nowMexico.timeStr;
  if (pedidoData.fechaPedido) {
    const dateStr = String(pedidoData.fechaPedido).trim().slice(0, 10);
    fechaPedido = new Date(`${dateStr}T${horaPedido}:00-06:00`);
  } else {
    fechaPedido = nowMexico.date;
    horaPedido = nowMexico.timeStr;
  }

  // Calcular totales
  const cantidadProductos = pedidoData.productos?.length || 0;
  // Usar subtotal si está disponible, sino calcular desde precio * cantidad
  const ventaTotal = pedidoData.productos?.reduce((sum, p) => {
    if (p.subtotal !== undefined && p.subtotal !== null) {
      return sum + parseFloat(p.subtotal);
    }
    const precio = parseFloat(p.precio || 0);
    const cantidad = parseFloat(p.cantidad || 0);
    return sum + (precio * cantidad);
  }, 0) || 0;
  
  // Si se proporciona totalMonto explícitamente, usarlo (tiene prioridad)
  const ventaTotalFinal = pedidoData.totalMonto !== undefined && pedidoData.totalMonto !== null 
    ? parseFloat(pedidoData.totalMonto) 
    : ventaTotal;

  const maxIntentos = 3;
  let ultimoError;
  for (let intento = 0; intento < maxIntentos; intento++) {
    const numeroPedido = await generarNumeroPedido();
    try {
      const nuevoPedido = await prisma.pedido.create({
        data: {
          numeroPedido,
      clienteId: pedidoData.clienteId,
      rutaId: rutaId || null,
      fechaPedido,
      horaPedido,
      estado: 'pendiente',
      cantidadProductos,
      ventaTotal: ventaTotalFinal,
      tipoServicio: pedidoData.tipoServicio,
      repartidorId: pedidoData.repartidorId || null,
      observaciones: pedidoData.observaciones || null,
      calculoPipas: pedidoData.calculoPipas ? JSON.stringify(pedidoData.calculoPipas) : null,
      formasPago: pedidoData.formasPago ? JSON.stringify(pedidoData.formasPago) : null,
      sedeId: pedidoData.sedeId || null,
      // Crear los productos del pedido
      productosPedido: pedidoData.productos ? {
        create: pedidoData.productos.map(p => ({
          productoId: p.productoId,
          cantidad: p.cantidad,
          precio: p.precio,
          subtotal: p.precio * p.cantidad
        }))
      } : undefined
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          email: true,
          telefono: true
        }
      },
      ruta: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      },
      repartidor: {
        select: {
          id: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true
        }
      },
      sede: {
        select: {
          id: true,
          nombre: true
        }
      },
      productosPedido: {
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              categoriaId: true,
              precio: true,
              unidad: true,
              categoria: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true
                }
              }
            }
          }
        }
      }
    }
  });
      return nuevoPedido;
    } catch (err) {
      // P2002 = unique constraint (numeroPedido duplicado por concurrencia)
      if (err.code === 'P2002' && intento < maxIntentos - 1) {
        ultimoError = err;
        continue;
      }
      throw err;
    }
  }
  throw ultimoError || new Error('No se pudo crear el pedido (número duplicado)');
};

// Actualizar pedido
exports.updatePedido = async (id, updateData) => {
  const pedidoExistente = await prisma.pedido.findUnique({
    where: { id }
  });

  if (!pedidoExistente) {
    const error = new Error('Pedido no encontrado.');
    error.status = 404;
    throw error;
  }

  // Extraer productos del payload (no es un campo directo del modelo Pedido)
  const productos = updateData.productos;
  delete updateData.productos;

  // Convertir fechaPedido a DateTime si viene como string
  if (updateData.fechaPedido && typeof updateData.fechaPedido === 'string') {
    updateData.fechaPedido = new Date(updateData.fechaPedido);
  }

  // Recalcular ventaTotal y cantidadProductos si se actualizan productos
  if (productos && Array.isArray(productos)) {
    updateData.cantidadProductos = productos.length;
    updateData.ventaTotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  }

  // Stringify calculoPipas y formasPago si vienen como objetos
  if (updateData.calculoPipas && typeof updateData.calculoPipas !== 'string') {
    updateData.calculoPipas = JSON.stringify(updateData.calculoPipas);
  }
  if (updateData.formasPago && typeof updateData.formasPago !== 'string') {
    updateData.formasPago = JSON.stringify(updateData.formasPago);
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const pedidoActualizado = await tx.pedido.update({
      where: { id },
      data: updateData,
      include: {
        cliente: true,
        ruta: true,
        repartidor: true,
        sede: true
      }
    });

    if (productos && Array.isArray(productos)) {
      await tx.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      if (productos.length > 0) {
        await tx.pedidoProducto.createMany({
          data: productos.map((p) => ({
            pedidoId: id,
            productoId: p.productoId,
            cantidad: Math.round(Number(p.cantidad)) || 0,
            precio: Number(p.precio) || 0,
            subtotal: (Number(p.precio) || 0) * (Math.round(Number(p.cantidad)) || 0)
          }))
        });
      }
    }

    return tx.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        ruta: true,
        repartidor: true,
        sede: true,
        productosPedido: { include: { producto: true } }
      }
    });
  });

  return resultado;
};

// Eliminar pedido
exports.deletePedido = async (id) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id }
  });
  
  if (!pedido) {
    const error = new Error('Pedido no encontrado.');
    error.status = 404;
    throw error;
  }
  
  return await prisma.pedido.delete({
    where: { id }
  });
};

