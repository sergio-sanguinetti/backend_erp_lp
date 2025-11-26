// services/creditoAbono.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

  // Actualizar saldo actual del cliente
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

  return await prisma.notaCredito.findMany({
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
};

exports.getNotaCreditoById = async (id) => {
  return await prisma.notaCredito.findUnique({
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

// ========== PAGOS ==========

exports.createPago = async (pagoData) => {
  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: pagoData.clienteId }
  });

  if (!cliente) {
    throw new Error('Cliente no encontrado.');
  }

  // Crear el pago
  const nuevoPago = await prisma.pago.create({
    data: {
      clienteId: pagoData.clienteId,
      notaCreditoId: pagoData.notaCreditoId || null,
      montoTotal: pagoData.montoTotal,
      tipo: pagoData.tipo,
      fechaPago: new Date(pagoData.fechaPago),
      horaPago: pagoData.horaPago,
      observaciones: pagoData.observaciones || null,
      usuarioRegistro: pagoData.usuarioRegistro,
      usuarioAutorizacion: pagoData.usuarioAutorizacion || null,
      estado: pagoData.estado || 'pendiente',
      formasPago: {
        create: pagoData.formasPago.map(fp => ({
          formaPagoId: fp.formaPagoId,
          monto: fp.monto,
          referencia: fp.referencia || null,
          banco: fp.banco || null
        }))
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

  // Si el pago está autorizado, actualizar saldos
  if (nuevoPago.estado === 'autorizado') {
    // Actualizar saldo del cliente
    await prisma.cliente.update({
      where: { id: pagoData.clienteId },
      data: {
        saldoActual: {
          decrement: pagoData.montoTotal
        }
      }
    });

    // Si es pago a nota específica, actualizar saldo pendiente
    if (pagoData.notaCreditoId) {
      const notaCredito = await prisma.notaCredito.findUnique({
        where: { id: pagoData.notaCreditoId }
      });

      if (notaCredito) {
        const nuevoSaldo = Math.max(0, notaCredito.saldoPendiente - pagoData.montoTotal);
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
  const where = {};

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  const notas = await prisma.notaCredito.findMany({
    where: {
      ...where,
      estado: {
        not: 'pagada'
      }
    }
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

  return await prisma.historialLimiteCredito.findMany({
    where,
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
  });
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

