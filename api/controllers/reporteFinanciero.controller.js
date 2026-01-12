const reporteFinancieroService = require('../../services/reporteFinanciero.service');

// Antigüedad de Cartera
exports.getAntiguedadCartera = async (req, res, next) => {
  try {
    const antiguedad = await reporteFinancieroService.getAntiguedadCartera();
    res.status(200).json(antiguedad);
  } catch (error) {
    next(error);
  }
};

// Top Mejores Pagadores
exports.getTopMejoresPagadores = async (req, res, next) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const mejores = await reporteFinancieroService.getTopMejoresPagadores(limite);
    res.status(200).json(mejores);
  } catch (error) {
    next(error);
  }
};

// Top Peores Pagadores
exports.getTopPeoresPagadores = async (req, res, next) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const peores = await reporteFinancieroService.getTopPeoresPagadores(limite);
    res.status(200).json(peores);
  } catch (error) {
    next(error);
  }
};

// Análisis de Riesgo
exports.getAnalisisRiesgo = async (req, res, next) => {
  try {
    const analisis = await reporteFinancieroService.getAnalisisRiesgo();
    res.status(200).json(analisis);
  } catch (error) {
    next(error);
  }
};

// Clientes para Visita de Cobranza
exports.getClientesVisitaCobranza = async (req, res, next) => {
  try {
    const rutaId = req.query.rutaId || null;
    const clientes = await reporteFinancieroService.getClientesVisitaCobranza(rutaId);
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};

// Recordatorios por Enviar
exports.getRecordatoriosPorEnviar = async (req, res, next) => {
  try {
    const recordatorios = await reporteFinancieroService.getRecordatoriosPorEnviar();
    res.status(200).json(recordatorios);
  } catch (error) {
    next(error);
  }
};

// Transferencias Pendientes
exports.getTransferenciasPendientes = async (req, res, next) => {
  try {
    const transferencias = await reporteFinancieroService.getTransferenciasPendientes();
    res.status(200).json(transferencias);
  } catch (error) {
    next(error);
  }
};

// Clientes con Límite Excedido
exports.getClientesLimiteExcedido = async (req, res, next) => {
  try {
    const clientes = await reporteFinancieroService.getClientesLimiteExcedido();
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};

// Comparativo Cartera vs Ventas
exports.getComparativoCarteraVentas = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const comparativo = await reporteFinancieroService.getComparativoCarteraVentas(fechaDesde, fechaHasta);
    res.status(200).json(comparativo);
  } catch (error) {
    next(error);
  }
};

// Eficiencia de Cobranza por Repartidor
exports.getEficienciaCobranzaRepartidor = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const eficiencia = await reporteFinancieroService.getEficienciaCobranzaRepartidor(fechaDesde, fechaHasta);
    res.status(200).json(eficiencia);
  } catch (error) {
    next(error);
  }
};

// Tendencias de Pago
exports.getTendenciasPago = async (req, res, next) => {
  try {
    const meses = parseInt(req.query.meses) || 12;
    const tendencias = await reporteFinancieroService.getTendenciasPago(meses);
    res.status(200).json(tendencias);
  } catch (error) {
    next(error);
  }
};

// Proyección de Flujo de Caja
exports.getProyeccionFlujoCaja = async (req, res, next) => {
  try {
    const meses = parseInt(req.query.meses) || 6;
    const proyeccion = await reporteFinancieroService.getProyeccionFlujoCaja(meses);
    res.status(200).json(proyeccion);
  } catch (error) {
    next(error);
  }
};

