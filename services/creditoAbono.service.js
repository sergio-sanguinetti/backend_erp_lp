// services/creditoAbono.service.js
const { prisma } = require('../config/database');

// ========== NOTAS DE CRÉDITO ==========

exports.createNotaCredito = async (notaCreditoData) => {
  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: notaCreditoData.clienteId }
  });

  if (!cliente) {
    throw new Error('Cliente no encontrado.');
  }

  // Generar número de nota único
  const numeroNota = await generarNumeroNota();

  // Calcular días de vencimiento
  const fechaVencimiento = new Date(notaCreditoData.fechaVencimiento);
  const hoy = new Date();
  const diasVencimiento = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

  // Determinar estado
  let estado = 'vigente';
  if (diasVencimiento < 0) {
    estado = 'vencida';
  } else if (diasVencimiento <= 7) {
    estado = 'por_vencer';
  }

  const nuevaNotaCredito = await prisma.notaCredito.create({
    data: {
      numeroNota,
      clienteId: notaCreditoData.clienteId,
      pedidoId: notaCreditoData.pedidoId || null,
      fechaVenta: new Date(notaCreditoData.fechaVenta),
      fechaVencimiento: fechaVencimiento,
      importe: notaCreditoData.importe,
      saldoPendiente: notaCreditoData.importe,
      diasVencimiento,
      estado,
      observaciones: notaCreditoData.observaciones || null
    },
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      pedido: true
    }
  });

  // Actualizar saldo actual del cliente (INCREMENTAR DEUDA)
  await prisma.cliente.update({
    where: { id: notaCreditoData.clienteId },
    data: {
      saldoActual: {
        increment: notaCreditoData.importe
      }
    }
  });

  return nuevaNotaCredito;
};

exports.getAllNotasCredito = async (filtros = {}) => {
  const where = {};

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  if (filtros.estado) {
    where.estado = filtros.estado;
  }

  if (filtros.fechaDesde) {
    where.fechaVenta = {
      ...where.fechaVenta,
      gte: new Date(filtros.fechaDesde)
    };
  }

  if (filtros.fechaHasta) {
    where.fechaVenta = {
      ...where.fechaVenta,
      lte: new Date(filtros.fechaHasta)
    };
  }

  if (filtros.rutaId) {
    where.cliente = { rutaId: filtros.rutaId };
  }

  const notas = await prisma.notaCredito.findMany({
    where,
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      pedido: true
    },
    orderBy: {
      fechaVenta: 'desc'
    }
  });

  // Parsear campos JSON en pedidos relacionados
  return notas.map(nota => {
    if (nota.pedido) {
      if (nota.pedido.calculoPipas && typeof nota.pedido.calculoPipas === 'string') {
        try { nota.pedido.calculoPipas = JSON.parse(nota.pedido.calculoPipas); } catch (e) {}
      }
      if (nota.pedido.formasPago && typeof nota.pedido.formasPago === 'string') {
        try { nota.pedido.formasPago = JSON.parse(nota.pedido.formasPago); } catch (e) {}
      }
    }
    return nota;
  });
};

exports.getNotaCreditoById = async (id) => {
  const nota = await prisma.notaCredito.findUnique({
    where: { id },
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      pedido: true,
      pagos: {
        include: {
          formasPago: {
            include: {
              formaPago: true
            }
          }
        }
      }
    }
  });

  if (nota && nota.pedido) {
    if (nota.pedido.calculoPipas && typeof nota.pedido.calculoPipas === 'string') {
      try { nota.pedido.calculoPipas = JSON.parse(nota.pedido.calculoPipas); } catch (e) {}
    }
    if (nota.pedido.formasPago && typeof nota.pedido.formasPago === 'string') {
      try { nota.pedido.formasPago = JSON.parse(nota.pedido.formasPago); } catch (e) {}
    }
  }

  return nota;
};

exports.updateNotaCredito = async (id, updateData) => {
  const notaCredito = await prisma.notaCredito.findUnique({
    where: { id }
  });

  if (!notaCredito) {
    throw new Error('Nota de crédito no encontrada.');
  }

  const data = {};

  if (updateData.fechaVencimiento) {
    const fechaVencimiento = new Date(updateData.fechaVencimiento);
    const hoy = new Date();
    const diasVencimiento = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    data.fechaVencimiento = fechaVencimiento;
    data.diasVencimiento = diasVencimiento;

    // Actualizar estado
    if (diasVencimiento < 0) {
      data.estado = 'vencida';
    } else if (diasVencimiento <= 7) {
      data.estado = 'por_vencer';
    } else {
      data.estado = 'vigente';
    }
  }

  if (updateData.observaciones !== undefined) {
    data.observaciones = updateData.observaciones;
  }

  return await prisma.notaCredito.update({
    where: { id },
    data,
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      pedido: true
    }
  });
};

exports.deleteNotaCredito = async (id) => {
  const notaCredito = await prisma.notaCredito.findUnique({
    where: { id }
  });

  if (!notaCredito) {
    throw new Error('Nota de crédito no encontrada.');
  }

  // Revertir saldo del cliente
  await prisma.cliente.update({
    where: { id: notaCredito.clienteId },
    data: {
      saldoActual: {
        decrement: notaCredito.importe
      }
    }
  });

  return await prisma.notaCredito.delete({
    where: { id }
  });
};

// ========== PAGOS (Abonos a Deuda) ==========

const createNotaCreditoLocal = async (notaCreditoData) => {
  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: notaCreditoData.clienteId }
  });

  if (!cliente) {
    throw new Error('Cliente no encontrado.');
  }

  // Generar número de nota único
  const numeroNota = await generarNumeroNota();

  // Calcular días de vencimiento
  const fechaVencimiento = new Date(notaCreditoData.fechaVencimiento);
  const hoy = new Date();
  const diasVencimiento = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

  // Determinar estado
  let estado = 'vigente';
  if (diasVencimiento < 0) {
    estado = 'vencida';
  } else if (diasVencimiento <= 7) {
    estado = 'por_vencer';
  }

  const nuevaNotaCredito = await prisma.notaCredito.create({
    data: {
      numeroNota,
      clienteId: notaCreditoData.clienteId,
      pedidoId: notaCreditoData.pedidoId || null,
      fechaVenta: new Date(notaCreditoData.fechaVenta),
      fechaVencimiento: fechaVencimiento,
      importe: notaCreditoData.importe,
      saldoPendiente: notaCreditoData.importe,
      diasVencimiento,
      estado,
      observaciones: notaCreditoData.observaciones || null
    },
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      pedido: true
    }
  });

  // Actualizar saldo actual del cliente (INCREMENTAR DEUDA)
  await prisma.cliente.update({
    where: { id: notaCreditoData.clienteId },
    data: {
      saldoActual: {
        increment: notaCreditoData.importe
      }
    }
  });

  return nuevaNotaCredito;
};

exports.createNotaCredito = createNotaCreditoLocal;

exports.createPago = async (pagoData) => {
  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: pagoData.clienteId }
  });

  if (!cliente) {
    throw new Error('Cliente no encontrado.');
  }

  // SI ES UN PAGO DE PEDIDO (CERRAR VENTA)
  if (pagoData.pedidoId) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pagoData.pedidoId }
    });
    if (!pedido) {
      throw new Error('Pedido no encontrado.');
    }

    // 1. Registrar en la tabla pagos_pedidos (breakdown)
    // formasPago puede ser array o objeto { items: [...], descuento, descuentoMonto, ... }
    const formasPagoArray = Array.isArray(pagoData.formasPago)
      ? pagoData.formasPago
      : (pagoData.formasPago && pagoData.formasPago.items) || [];
    if (formasPagoArray.length > 0) {
      console.log('Procesando formas de pago para pedido:', pagoData.pedidoId);
      for (const fp of formasPagoArray) {
        console.log('Forma de pago:', fp);
        // Registrar el pago del pedido
        await prisma.pagoPedido.create({
          data: {
            pedidoId: pagoData.pedidoId,
            monto: parseFloat(fp.monto),
            folio: fp.referencia || null,
            tipo: fp.tipo === 'credito' ? 'credito' : 'metodo_pago',
            metodoId: fp.formaPagoId || null,
            firmaCliente: fp.firmaCliente || null // Guardar la firma del cliente si existe
          }
        });

        // 2. Si es crédito, generar la Nota de Crédito (ESTO INCREMENTA LA DEUDA)
        if (fp.tipo === 'credito') {
          console.log('--- DETECTADO PAGO CON CRÉDITO ---');
          console.log('Monto:', fp.monto);
          console.log('ClienteId:', pagoData.clienteId);
          await createNotaCreditoLocal({
            clienteId: pagoData.clienteId,
            pedidoId: pagoData.pedidoId,
            fechaVenta: new Date(),
            fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días por defecto
            importe: parseFloat(fp.monto),
            observaciones: `Crédito generado desde venta de pedido ${pedido.numeroPedido || pedido.id}`
          });
          console.log('--- NOTA DE CRÉDITO GENERADA EXITOSAMENTE ---');
        }
      }
    }

    // 3. Actualizar el pedido a entregado (guardar formasPago con items + descuento para ticket, reimpresión y corte de día)
    const hasDiscount = pagoData.descuento != null || (pagoData.descuentoMonto != null && Number(pagoData.descuentoMonto) > 0);
    const formasPagoToStore =
      formasPagoArray.length > 0 || hasDiscount
        ? {
            items: formasPagoArray,
            descuento: pagoData.descuento ?? null,
            descuentoMonto: pagoData.descuentoMonto != null ? Number(pagoData.descuentoMonto) : null,
            discountType: pagoData.discountType || null,
            discountName: pagoData.discountName || null
          }
        : null;
    return await prisma.pedido.update({
      where: { id: pagoData.pedidoId },
      data: {
        estado: 'entregado',
        montoPagado: pagoData.montoTotal,
        formasPago: formasPagoToStore != null ? JSON.stringify(formasPagoToStore) : null
      },
      include: {
        cliente: true
      }
    });
  }

  // SI ES UN ABONO GENERAL O PAGO A NOTA (Módulo Créditos y Abonos)
  // Evitar saldo negativo: limitar monto del abono al saldo actual del cliente
  const saldoActualCliente = Number(cliente.saldoActual) || 0;
  const montoSolicitado = Number(pagoData.montoTotal) || 0;
  const montoAbono = Math.min(montoSolicitado, Math.max(0, saldoActualCliente));

  if (montoAbono <= 0) {
    throw new Error('El cliente no tiene saldo pendiente para abonar. No se puede registrar el abono.');
  }

    const formasPagoAbono = (pagoData.formasPago || []).map(fp => {
      const montoFp = (fp.monto != null && fp.monto !== '') ? parseFloat(fp.monto) : null;
      return {
        formaPagoId: fp.formaPagoId,
        monto: montoFp != null && !isNaN(montoFp) ? montoFp : montoAbono / Math.max(1, (pagoData.formasPago || []).length),
        referencia: fp.referencia || null,
        banco: fp.banco || null
      };
    });

    const nuevoPago = await prisma.pago.create({
      data: {
        clienteId: pagoData.clienteId,
        notaCreditoId: pagoData.notaCreditoId || null,
        montoTotal: montoAbono,
        tipo: pagoData.tipo,
        fechaPago: new Date(pagoData.fechaPago),
        horaPago: pagoData.horaPago,
        observaciones: pagoData.observaciones || null,
        usuarioRegistro: pagoData.usuarioRegistro,
        usuarioAutorizacion: pagoData.usuarioAutorizacion || null,
        estado: pagoData.estado || 'pendiente',
        formasPago: {
          create: formasPagoAbono
        }
      },
      include: {
        cliente: {
          include: {
            ruta: true
          }
        },
        notaCredito: true,
        formasPago: {
          include: {
            formaPago: true
          }
        }
      }
    });

    // REGISTRAR EN LA TABLA abonos_cliente: una fila por forma de pago con su monto (no el total del abono)
    if (formasPagoAbono && formasPagoAbono.length > 0) {
      console.log('--- REGISTRANDO EN abonos_cliente ---');
      for (const fp of formasPagoAbono) {
        try {
          await prisma.abonoCliente.create({
            data: {
              clienteId: pagoData.clienteId,
              monto: fp.monto,
              fecha: new Date(pagoData.fechaPago),
              formaPagoId: fp.formaPagoId,
              folio: fp.referencia || null,
              notaCreditoId: pagoData.notaCreditoId || null,
              usuarioRegistro: pagoData.usuarioRegistro || 'APP_USER',
              observaciones: pagoData.observaciones || null
            }
          });
          console.log('Abono registrado en abonos_cliente para fp:', fp.formaPagoId, 'monto:', fp.monto);
        } catch (error) {
          console.error('ERROR al registrar en abonos_cliente:', error);
          throw new Error('El abono se creó pero falló el registro en abonos_cliente. Verifique la base de datos.');
        }
      }
    }

  // RESTAR DE LA DEUDA INMEDIATAMENTE (al crear el abono). Nunca dejar saldo negativo.
  const nuevoSaldoCliente = Math.max(0, saldoActualCliente - montoAbono);
  await prisma.cliente.update({
    where: { id: pagoData.clienteId },
    data: {
      saldoActual: nuevoSaldoCliente
    }
  });

  // Si es pago a nota específica, actualizar saldo pendiente de la nota
  if (pagoData.notaCreditoId) {
    const notaCredito = await prisma.notaCredito.findUnique({
      where: { id: pagoData.notaCreditoId }
    });

    if (notaCredito) {
      const nuevoSaldo = Math.max(0, notaCredito.saldoPendiente - montoAbono);
      const estado = nuevoSaldo === 0 ? 'pagada' : notaCredito.estado;

      await prisma.notaCredito.update({
        where: { id: pagoData.notaCreditoId },
        data: {
          saldoPendiente: nuevoSaldo,
          estado
        }
      });
    }
  }

  return nuevoPago;
};

exports.getAllPagos = async (filtros = {}) => {
  const where = {};

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  if (filtros.estado) {
    where.estado = filtros.estado;
  }

  if (filtros.fechaDesde) {
    where.fechaPago = {
      ...where.fechaPago,
      gte: new Date(filtros.fechaDesde)
    };
  }

  if (filtros.fechaHasta) {
    where.fechaPago = {
      ...where.fechaPago,
      lte: new Date(filtros.fechaHasta)
    };
  }

  if (filtros.rutaId) {
    where.cliente = { rutaId: filtros.rutaId };
  }

  return await prisma.pago.findMany({
    where,
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      notaCredito: true,
      formasPago: {
        include: {
          formaPago: true
        }
      }
    },
    orderBy: {
      fechaPago: 'desc'
    }
  });
};

exports.getPagoById = async (id) => {
  return await prisma.pago.findUnique({
    where: { id },
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      notaCredito: true,
      formasPago: {
        include: {
          formaPago: true
        }
      }
    }
  });
};

exports.updatePagoEstado = async (id, estado, usuarioAutorizacion) => {
  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      notaCredito: true
    }
  });

  if (!pago) {
    throw new Error('Pago no encontrado.');
  }

  const data = {
    estado,
    usuarioAutorizacion: usuarioAutorizacion || null
  };

  const pagoActualizado = await prisma.pago.update({
    where: { id },
    data,
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      notaCredito: true,
      formasPago: {
        include: {
          formaPago: true
        }
      }
    }
  });

  // Si se autoriza el pago, actualizar saldos
  if (estado === 'autorizado' && pago.estado !== 'autorizado') {
    // Actualizar saldo del cliente
    await prisma.cliente.update({
      where: { id: pago.clienteId },
      data: {
        saldoActual: {
          decrement: pago.montoTotal
        }
      }
    });

    // Si es pago a nota específica, actualizar saldo pendiente
    if (pago.notaCreditoId) {
      const notaCredito = await prisma.notaCredito.findUnique({
        where: { id: pago.notaCreditoId }
      });

      if (notaCredito) {
        const nuevoSaldo = Math.max(0, notaCredito.saldoPendiente - pago.montoTotal);
        const estadoNota = nuevoSaldo === 0 ? 'pagada' : notaCredito.estado;

        await prisma.notaCredito.update({
          where: { id: pago.notaCreditoId },
          data: {
            saldoPendiente: nuevoSaldo,
            estado: estadoNota
          }
        });
      }
    }
  }

  // Si se rechaza o cancela un pago autorizado, revertir saldos
  if ((estado === 'rechazado' || estado === 'cancelado') && pago.estado === 'autorizado') {
    await prisma.cliente.update({
      where: { id: pago.clienteId },
      data: {
        saldoActual: {
          increment: pago.montoTotal
        }
      }
    });

    if (pago.notaCreditoId) {
      const notaCredito = await prisma.notaCredito.findUnique({
        where: { id: pago.notaCreditoId }
      });

      if (notaCredito) {
        await prisma.notaCredito.update({
          where: { id: pago.notaCreditoId },
          data: {
            saldoPendiente: {
              increment: pago.montoTotal
            }
          }
        });
      }
    }
  }

  return pagoActualizado;
};

// ========== RESUMEN DE CARTERA ==========

exports.getResumenCartera = async (filtros = {}) => {
  const where = {
    estado: { not: 'pagada' }
  };

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  if (filtros.rutaId) {
    where.cliente = { rutaId: filtros.rutaId };
  }

  const notas = await prisma.notaCredito.findMany({
    where
  });

  const carteraTotal = notas.reduce((sum, nota) => sum + nota.saldoPendiente, 0);
  const notasPendientes = notas.length;
  const carteraVencida = notas
    .filter(nota => nota.estado === 'vencida')
    .reduce((sum, nota) => sum + nota.saldoPendiente, 0);
  const notasVencidas = notas.filter(nota => nota.estado === 'vencida').length;
  const carteraPorVencer = notas
    .filter(nota => nota.estado === 'por_vencer')
    .reduce((sum, nota) => sum + nota.saldoPendiente, 0);
  const notasPorVencer = notas.filter(nota => nota.estado === 'por_vencer').length;

  return {
    carteraTotal,
    notasPendientes,
    carteraVencida,
    notasVencidas,
    porcentajeVencida: carteraTotal > 0 ? (carteraVencida / carteraTotal) * 100 : 0,
    carteraPorVencer,
    notasPorVencer,
    porcentajePorVencer: carteraTotal > 0 ? (carteraPorVencer / carteraTotal) * 100 : 0
  };
};

// ========== HISTORIAL DE LÍMITES ==========

exports.createHistorialLimite = async (historialData) => {
  return await prisma.historialLimiteCredito.create({
    data: {
      clienteId: historialData.clienteId,
      usuarioId: historialData.usuarioId,
      limiteAnterior: historialData.limiteAnterior,
      limiteNuevo: historialData.limiteNuevo,
      motivo: historialData.motivo
    },
    include: {
      cliente: {
        include: {
          ruta: true
        }
      },
      usuario: true
    }
  });
};

exports.getHistorialLimites = async (filtros = {}) => {
  const where = {};

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  if (filtros.rutaId) {
    where.cliente = { rutaId: filtros.rutaId };
  }

  const page = Math.max(1, parseInt(filtros.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filtros.pageSize, 10) || 10));
  const skip = (page - 1) * pageSize;

  const [total, data] = await Promise.all([
    prisma.historialLimiteCredito.count({ where }),
    prisma.historialLimiteCredito.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        cliente: {
          include: {
            ruta: true
          }
        },
        usuario: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })
  ]);

  return { data, total };
};

// ========== FUNCIONES AUXILIARES ==========

async function generarNumeroNota() {
  const ultimaNota = await prisma.notaCredito.findFirst({
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  let numero = 1;
  if (ultimaNota) {
    const match = ultimaNota.numeroNota.match(/\d+$/);
    if (match) {
      numero = parseInt(match[0]) + 1;
    }
  }

  return `NC-${String(numero).padStart(6, '0')}`;
}

// Actualizar estados de notas de crédito (ejecutar periódicamente)
exports.actualizarEstadosNotas = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const notas = await prisma.notaCredito.findMany({
    where: {
      estado: {
        not: 'pagada'
      }
    }
  });

  for (const nota of notas) {
    const fechaVencimiento = new Date(nota.fechaVencimiento);
    fechaVencimiento.setHours(0, 0, 0, 0);
    const diasVencimiento = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    let estado = nota.estado;
    if (diasVencimiento < 0) {
      estado = 'vencida';
    } else if (diasVencimiento <= 7) {
      estado = 'por_vencer';
    } else {
      estado = 'vigente';
    }

    if (estado !== nota.estado) {
      await prisma.notaCredito.update({
        where: { id: nota.id },
        data: {
          estado,
          diasVencimiento
        }
      });
    }
  }
};
