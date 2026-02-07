// services/creditoAbono.service.js
const { prisma } = require('../config/database');
const { getMexicoCityDayBounds } = require('../utils/timezoneMexico');

/** Normaliza fecha a YYYY-MM-DD. Acepta YYYY-MM-DD o DD/MM/YYYY. */
function normalizarFechaStr(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

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
          let fechaVencimientoCredito;
          if (pagoData.fechaVencimiento) {
            fechaVencimientoCredito = new Date(pagoData.fechaVencimiento);
          } else {
            const dias = (pagoData.vigenciaPagoDias != null && !Number.isNaN(Number(pagoData.vigenciaPagoDias)) && Number(pagoData.vigenciaPagoDias) > 0)
              ? Number(pagoData.vigenciaPagoDias)
              : 15;
            fechaVencimientoCredito = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
          }
          await createNotaCreditoLocal({
            clienteId: pagoData.clienteId,
            pedidoId: pagoData.pedidoId,
            fechaVenta: new Date(),
            fechaVencimiento: fechaVencimientoCredito,
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

  let aplicacionDetalle = null;

  // Si es pago a nota específica: actualizar solo esa nota
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
      aplicacionDetalle = [{
        notaId: notaCredito.id,
        numeroNota: notaCredito.numeroNota,
        montoAplicado: montoAbono,
        saldoAnterior: notaCredito.saldoPendiente,
        saldoRestante: nuevoSaldo,
        estadoNota: estado
      }];
    }
  } else {
    // Abono global: aplicar FIFO (notas más antiguas primero)
    const notasPendientes = await prisma.notaCredito.findMany({
      where: {
        clienteId: pagoData.clienteId,
        estado: { not: 'pagada' },
        saldoPendiente: { gt: 0 }
      },
      orderBy: { fechaVenta: 'asc' }
    });

    let resto = montoAbono;
    aplicacionDetalle = [];

    for (const nota of notasPendientes) {
      if (resto <= 0) break;
      const montoAplicar = Math.min(resto, Number(nota.saldoPendiente));
      if (montoAplicar <= 0) continue;

      const saldoAnterior = Number(nota.saldoPendiente);
      const saldoRestante = Math.max(0, saldoAnterior - montoAplicar);
      const estadoNota = saldoRestante === 0 ? 'pagada' : nota.estado;

      await prisma.notaCredito.update({
        where: { id: nota.id },
        data: {
          saldoPendiente: saldoRestante,
          estado: estadoNota
        }
      });

      aplicacionDetalle.push({
        notaId: nota.id,
        numeroNota: nota.numeroNota,
        montoAplicado: montoAplicar,
        saldoAnterior,
        saldoRestante,
        estadoNota
      });
      resto -= montoAplicar;
    }
  }

  const pagoConDetalle = { ...nuevoPago, aplicacionDetalle };
  return pagoConDetalle;
};

exports.getAllPagos = async (filtros = {}) => {
  const where = {};

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  if (filtros.estado) {
    where.estado = filtros.estado;
  }

  let rangeStart;
  let rangeEnd;
  const fechaDesdeNorm = normalizarFechaStr(filtros.fechaDesde);
  const fechaHastaNorm = normalizarFechaStr(filtros.fechaHasta);
  if (fechaDesdeNorm) {
    const { start } = getMexicoCityDayBounds(fechaDesdeNorm);
    rangeStart = start;
    where.fechaPago = {
      ...where.fechaPago,
      gte: start
    };
  }
  if (fechaHastaNorm) {
    const { end } = getMexicoCityDayBounds(fechaHastaNorm);
    rangeEnd = end;
    where.fechaPago = {
      ...where.fechaPago,
      lte: end
    };
  }
  if (!rangeEnd && rangeStart && fechaDesdeNorm) {
    const { end } = getMexicoCityDayBounds(fechaDesdeNorm);
    rangeEnd = end;
  }
  if (!rangeStart && rangeEnd && fechaHastaNorm) {
    const { start } = getMexicoCityDayBounds(fechaHastaNorm);
    rangeStart = start;
  }

  if (filtros.rutaId) {
    where.cliente = { rutaId: filtros.rutaId };
  }

  const pagos = await prisma.pago.findMany({
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

  // Incluir también abonos de abonos_cliente que no tengan pago en la tabla pagos
  const hasDateFilter = rangeStart != null && rangeEnd != null;
  if (hasDateFilter) {
    try {
      const whereAbono = {
        fecha: { gte: rangeStart, lte: rangeEnd }
      };
      if (filtros.clienteId) whereAbono.clienteId = filtros.clienteId;
      if (filtros.rutaId) whereAbono.cliente = { rutaId: filtros.rutaId };

      const abonos = await prisma.abonoCliente.findMany({
        where: whereAbono,
        include: {
          cliente: { include: { ruta: true } },
          formaPago: true,
          notaCredito: true
        },
        orderBy: { fecha: 'desc' }
      });

      const key = (a) => {
        const d = new Date(a.fecha);
        const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        return `${a.clienteId}|${day}|${a.notaCreditoId || ''}`;
      };
      const grupos = new Map();
      for (const a of abonos) {
        const k = key(a);
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(a);
      }

      const pagosKeys = new Set(
        pagos.map((p) => {
          const d = new Date(p.fechaPago);
          const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          return `${p.clienteId}|${day}|${p.notaCreditoId || ''}`;
        })
      );

      for (const [, grupo] of grupos) {
        const k = key(grupo[0]);
        if (pagosKeys.has(k)) continue;
        const primero = grupo[0];
        const fechaPago = new Date(primero.fecha);
        const horaPago = `${String(fechaPago.getUTCHours()).padStart(2, '0')}:${String(fechaPago.getUTCMinutes()).padStart(2, '0')}`;
        const montoTotal = grupo.reduce((s, a) => s + a.monto, 0);
        pagos.push({
          id: `abono_${primero.id}`,
          clienteId: primero.clienteId,
          notaCreditoId: primero.notaCreditoId,
          montoTotal,
          tipo: primero.notaCreditoId ? 'nota_especifica' : 'abono_general',
          fechaPago,
          horaPago,
          observaciones: primero.observaciones || null,
          usuarioRegistro: primero.usuarioRegistro,
          usuarioAutorizacion: null,
          estado: 'autorizado',
          cliente: primero.cliente,
          notaCredito: primero.notaCredito,
          formasPago: grupo.map((a) => {
            const fp = a.formaPago;
            const metodo = (fp && (fp.tipo || fp.nombre)) ? (fp.tipo || fp.nombre) : 'efectivo';
            return {
              id: a.id,
              monto: a.monto,
              metodo: String(metodo),
              formaPago: fp
            };
          })
        });
      }

      pagos.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
    } catch (err) {
      console.error('getAllPagos: error al incluir abonos_cliente:', err.message);
    }
  }

  return pagos;
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

  // Los abonos (pagos a nota o abono general) ya aplican la reducción de deuda al crearse en createPago.
  // Al autorizar NO se debe volver a restar del saldo: el límite de crédito NUNCA debe cambiar por pagos,
  // y el adeudo (saldoActual) ya fue restado al registrar el pago. Si volviéramos a decrementar aquí,
  // saldoActual quedaría negativo y crédito disponible = limiteCredito - saldoActual parecería que el límite subió.
  // Por tanto: al pasar a 'autorizado' solo actualizamos el estado del pago, no tocamos cliente ni nota.

  // Si se rechaza o cancela un pago, revertir la aplicación del abono (la deuda vuelve a subir).
  // Solo revertir cuando pasamos de pendiente/autorizado a rechazado/cancelado (no si ya estaba rechazado).
  const estabaAplicado = pago.estado !== 'rechazado' && pago.estado !== 'cancelado';
  if ((estado === 'rechazado' || estado === 'cancelado') && estabaAplicado) {
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

const ESTADO_CLIENTE_VALIDOS = ['activo', 'suspendido', 'inactivo'];

exports.getResumenCartera = async (filtros = {}) => {
  const where = {
    estado: { not: 'pagada' }
  };

  if (filtros.clienteId) {
    where.clienteId = filtros.clienteId;
  }

  // Filtro por fechas (fecha de venta de la nota)
  const fechaDesdeNorm = normalizarFechaStr(filtros.fechaDesde);
  const fechaHastaNorm = normalizarFechaStr(filtros.fechaHasta);
  if (fechaDesdeNorm) {
    const { start } = getMexicoCityDayBounds(fechaDesdeNorm);
    where.fechaVenta = { ...where.fechaVenta, gte: start };
  }
  if (fechaHastaNorm) {
    const { end } = getMexicoCityDayBounds(fechaHastaNorm);
    where.fechaVenta = { ...where.fechaVenta, lte: end };
  }

  // Filtros por cliente: ruta, estadoCliente (enum), saldo mínimo/máximo
  const clienteWhere = {};
  if (filtros.rutaId) {
    clienteWhere.rutaId = filtros.rutaId;
  }
  if (filtros.estadoCliente && ESTADO_CLIENTE_VALIDOS.includes(String(filtros.estadoCliente).toLowerCase())) {
    clienteWhere.estadoCliente = filtros.estadoCliente.toLowerCase();
  }
  const saldoMin = filtros.saldoMin != null && !Number.isNaN(Number(filtros.saldoMin)) ? Number(filtros.saldoMin) : null;
  const saldoMax = filtros.saldoMax != null && !Number.isNaN(Number(filtros.saldoMax)) ? Number(filtros.saldoMax) : null;
  if (saldoMin != null || saldoMax != null) {
    clienteWhere.saldoActual = {};
    if (saldoMin != null) clienteWhere.saldoActual.gte = saldoMin;
    if (saldoMax != null) clienteWhere.saldoActual.lte = saldoMax;
  }
  if (Object.keys(clienteWhere).length > 0) {
    where.cliente = clienteWhere;
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
