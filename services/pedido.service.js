const { prisma } = require('../config/database');

// Generar número de pedido único
const generarNumeroPedido = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  // Contar pedidos del día
  const inicioDia = new Date(fecha.setHours(0, 0, 0, 0));
  const finDia = new Date(fecha.setHours(23, 59, 59, 999));
  
  const pedidosDelDia = await prisma.pedido.count({
    where: {
      fechaCreacion: {
        gte: inicioDia,
        lte: finDia
      }
    }
  });
  
  const numero = String(pedidosDelDia + 1).padStart(4, '0');
  return `PED-${año}${mes}${dia}-${numero}`;
};

// Obtener todos los pedidos con filtros
exports.getAllPedidos = async (filtros = {}) => {
  const where = {};
  
  if (filtros.fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(filtros.fechaDesde)
    };
  }
  
  if (filtros.fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(filtros.fechaHasta)
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
      }
    },
    orderBy: { fechaCreacion: 'desc' }
  });
  
  console.log('Pedidos encontrados en DB:', pedidos.length);
  if (pedidos.length > 0) {
    console.log('Primer pedido:', { id: pedidos[0].id, numeroPedido: pedidos[0].numeroPedido, sedeId: pedidos[0].sedeId });
  }
  
  return pedidos;
};

// Obtener pedido por ID
exports.findPedidoById = async (id) => {
  return await prisma.pedido.findUnique({
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
      }
    }
  });
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
  
  // Generar número de pedido
  const numeroPedido = await generarNumeroPedido();
  
  // Convertir fechaPedido a DateTime si viene como string
  const fechaPedido = pedidoData.fechaPedido 
    ? new Date(pedidoData.fechaPedido)
    : new Date();
  
  // Calcular totales
  const cantidadProductos = pedidoData.productos?.length || 0;
  const ventaTotal = pedidoData.productos?.reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;

  const nuevoPedido = await prisma.pedido.create({
    data: {
      numeroPedido,
      clienteId: pedidoData.clienteId,
      rutaId: rutaId || null,
      fechaPedido,
      horaPedido: pedidoData.horaPedido || new Date().toTimeString().slice(0, 5),
      estado: 'pendiente',
      cantidadProductos,
      ventaTotal,
      tipoServicio: pedidoData.tipoServicio,
      repartidorId: pedidoData.repartidorId || null,
      observaciones: pedidoData.observaciones || null,
      calculoPipas: pedidoData.calculoPipas || null,
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
  
  // Convertir fechaPedido a DateTime si viene como string
  if (updateData.fechaPedido && typeof updateData.fechaPedido === 'string') {
    updateData.fechaPedido = new Date(updateData.fechaPedido);
  }
  
  // Recalcular ventaTotal si se actualizan productos
  if (updateData.productos) {
    updateData.cantidadProductos = updateData.productos.length;
    updateData.ventaTotal = updateData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  }
  
  return await prisma.pedido.update({
    where: { id },
    data: updateData,
    include: {
      cliente: true,
      ruta: true,
      repartidor: true,
      sede: true
    }
  });
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

