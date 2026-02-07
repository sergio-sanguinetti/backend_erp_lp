// api/controllers/creditoAbono.controller.js
const creditoAbonoService = require('../../services/creditoAbono.service');
const clienteService = require('../../services/cliente.service');

// ========== NOTAS DE CRÉDITO ==========

exports.getAllNotasCredito = async (req, res, next) => {
  try {
    const filtros = {
      clienteId: req.query.clienteId,
      estado: req.query.estado,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta
    };

    const notas = await creditoAbonoService.getAllNotasCredito(filtros);
    res.status(200).json(notas);
  } catch (error) {
    next(error);
  }
};

exports.getNotaCreditoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const nota = await creditoAbonoService.getNotaCreditoById(id);

    if (!nota) {
      return res.status(404).json({ message: 'Nota de crédito no encontrada.' });
    }

    res.status(200).json(nota);
  } catch (error) {
    next(error);
  }
};

exports.createNotaCredito = async (req, res, next) => {
  try {
    const notaCreditoData = {
      clienteId: req.body.clienteId,
      pedidoId: req.body.pedidoId,
      fechaVenta: req.body.fechaVenta,
      fechaVencimiento: req.body.fechaVencimiento,
      importe: req.body.importe,
      observaciones: req.body.observaciones
    };

    const nota = await creditoAbonoService.createNotaCredito(notaCreditoData);

    res.status(201).json({
      message: 'Nota de crédito creada exitosamente.',
      notaCredito: nota
    });
  } catch (error) {
    next(error);
  }
};

exports.updateNotaCredito = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      fechaVencimiento: req.body.fechaVencimiento,
      observaciones: req.body.observaciones
    };

    const nota = await creditoAbonoService.updateNotaCredito(id, updateData);

    if (!nota) {
      return res.status(404).json({ message: 'Nota de crédito no encontrada.' });
    }

    res.status(200).json({
      message: 'Nota de crédito actualizada exitosamente.',
      notaCredito: nota
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotaCredito = async (req, res, next) => {
  try {
    const { id } = req.params;
    const nota = await creditoAbonoService.deleteNotaCredito(id);

    if (!nota) {
      return res.status(404).json({ message: 'Nota de crédito no encontrada.' });
    }

    res.status(200).json({
      message: 'Nota de crédito eliminada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

// ========== PAGOS ==========

exports.getAllPagos = async (req, res, next) => {
  try {
    const filtros = {
      clienteId: req.query.clienteId,
      estado: req.query.estado,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
      rutaId: req.query.rutaId
    };

    const pagos = await creditoAbonoService.getAllPagos(filtros);
    res.status(200).json(pagos);
  } catch (error) {
    next(error);
  }
};

exports.getPagoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pago = await creditoAbonoService.getPagoById(id);

    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    res.status(200).json(pago);
  } catch (error) {
    next(error);
  }
};

exports.createPago = async (req, res, next) => {
  try {
    const pagoData = {
      clienteId: req.body.clienteId,
      pedidoId: req.body.pedidoId, // Añadido para procesar pagos de pedidos
      notaCreditoId: req.body.notaCreditoId,
      montoTotal: req.body.montoTotal,
      tipo: req.body.tipo,
      fechaPago: req.body.fechaPago || new Date(),
      horaPago: req.body.horaPago || new Date().toTimeString().slice(0, 5),
      observaciones: req.body.observaciones,
      usuarioRegistro: req.body.usuarioRegistro || req.user.id,
      usuarioAutorizacion: req.body.usuarioAutorizacion,
      estado: req.body.estado || 'pendiente',
      formasPago: req.body.formasPago,
      firmaCliente: req.body.firmaCliente || null,
      // Vigencia de pago para crédito: días o fecha (usado al crear la nota de crédito)
      vigenciaPagoDias: req.body.vigenciaPagoDias != null ? Number(req.body.vigenciaPagoDias) : undefined,
      fechaVencimiento: req.body.fechaVencimiento || undefined,
      // Descuento: pasar al servicio para guardar en pedido.formasPago (ticket, reimpresión, corte de día)
      descuento: req.body.descuento ?? null,
      descuentoMonto: req.body.descuentoMonto != null ? Number(req.body.descuentoMonto) : null,
      discountType: req.body.discountType ?? null,
      discountName: req.body.discountName ?? null
    };

    const pago = await creditoAbonoService.createPago(pagoData);

    res.status(201).json({
      message: 'Pago registrado exitosamente.',
      pago
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePagoEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pago = await creditoAbonoService.updatePagoEstado(
      id,
      estado,
      req.user.id
    );

    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    res.status(200).json({
      message: 'Estado del pago actualizado exitosamente.',
      pago
    });
  } catch (error) {
    next(error);
  }
};

// ========== RESUMEN DE CARTERA ==========

exports.getResumenCartera = async (req, res, next) => {
  try {
    const filtros = {
      clienteId: req.query.clienteId,
      rutaId: req.query.rutaId,
      estadoCliente: req.query.estadoCliente,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
      saldoMin: req.query.saldoMin != null ? Number(req.query.saldoMin) : undefined,
      saldoMax: req.query.saldoMax != null ? Number(req.query.saldoMax) : undefined
    };

    const resumen = await creditoAbonoService.getResumenCartera(filtros);
    res.status(200).json(resumen);
  } catch (error) {
    next(error);
  }
};

// ========== CLIENTES CON CRÉDITO ==========

exports.getClientesCredito = async (req, res, next) => {
  try {
    const filtros = {
      nombre: req.query.nombre,
      rutaId: req.query.rutaId,
      estadoCliente: req.query.estadoCliente,
      sedeId: req.query.sedeId,
      saldoMin: req.query.saldoMin != null ? req.query.saldoMin : undefined,
      saldoMax: req.query.saldoMax != null ? req.query.saldoMax : undefined
    };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

    const { data: clientes, total } = await clienteService.getClientesPaginados(filtros, page, pageSize);

    const clientesConCredito = await Promise.all(
      clientes.map(async (cliente) => {
        const notas = await creditoAbonoService.getAllNotasCredito({
          clienteId: cliente.id
        });

        const diasPromedioPago = calcularDiasPromedioPago(cliente.id);
        const estado = determinarEstadoCliente(cliente, notas);

        return {
          id: cliente.id,
          nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`,
          direccion: `${cliente.calle} ${cliente.numeroExterior}, ${cliente.colonia}, ${cliente.municipio}, ${cliente.estado}`,
          telefono: cliente.telefono,
          ruta: cliente.ruta?.nombre || 'Sin ruta',
          limiteCredito: cliente.limiteCredito,
          saldoActual: cliente.saldoActual,
          creditoDisponible: cliente.limiteCredito - cliente.saldoActual,
          diasPromedioPago: await diasPromedioPago,
          estado,
          notasPendientes: notas
        };
      })
    );

    res.status(200).json({ clientes: clientesConCredito, total });
  } catch (error) {
    next(error);
  }
};

// ========== HISTORIAL DE LÍMITES ==========

exports.getHistorialLimites = async (req, res, next) => {
  try {
    const filtros = {
      clienteId: req.query.clienteId,
      rutaId: req.query.rutaId,
      page: req.query.page,
      pageSize: req.query.pageSize
    };

    const { data: historial, total } = await creditoAbonoService.getHistorialLimites(filtros);
    res.status(200).json({ historial, total });
  } catch (error) {
    next(error);
  }
};

exports.updateLimiteCredito = async (req, res, next) => {
  try {
    const { clienteId } = req.params;
    const { limiteCredito, motivo } = req.body;

    const cliente = await clienteService.findClienteById(clienteId);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // Crear historial
    await creditoAbonoService.createHistorialLimite({
      clienteId,
      usuarioId: req.user.id,
      limiteAnterior: cliente.limiteCredito,
      limiteNuevo: limiteCredito,
      motivo: motivo || 'Actualización de límite de crédito'
    });

    // Actualizar límite del cliente
    const clienteActualizado = await clienteService.updateCliente(clienteId, {
      limiteCredito
    });

    res.status(200).json({
      message: 'Límite de crédito actualizado exitosamente.',
      cliente: clienteActualizado
    });
  } catch (error) {
    next(error);
  }
};

// ========== FUNCIONES AUXILIARES ==========

async function calcularDiasPromedioPago(clienteId) {
  // Obtener pagos del cliente
  const pagos = await creditoAbonoService.getAllPagos({
    clienteId,
    estado: 'autorizado'
  });

  if (pagos.length === 0) return 0;

  // Calcular promedio (simplificado)
  return 25; // Valor por defecto, se puede mejorar con cálculo real
}

function determinarEstadoCliente(cliente, notas) {
  if (cliente.saldoActual > cliente.limiteCredito) {
    return 'critico';
  }

  const tieneVencidas = notas.some(n => n.estado === 'vencida');
  if (tieneVencidas) {
    return 'vencido';
  }

  if (cliente.saldoActual > cliente.limiteCredito * 0.8) {
    return 'critico';
  }

  return 'buen-pagador';
}

