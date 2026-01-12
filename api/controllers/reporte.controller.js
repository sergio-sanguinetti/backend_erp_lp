const reporteService = require('../../services/reporte.service');

// Obtener ventas por mes
exports.getVentasPorMes = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const ventas = await reporteService.getVentasPorMes(fechaDesde, fechaHasta);
    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

// Obtener cortes por mes
exports.getCortesPorMes = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const cortes = await reporteService.getCortesPorMes(fechaDesde, fechaHasta);
    res.status(200).json(cortes);
  } catch (error) {
    next(error);
  }
};

// Obtener dinero entregado por cortes
exports.getDineroEntregadoPorCortes = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const dinero = await reporteService.getDineroEntregadoPorCortes(fechaDesde, fechaHasta);
    res.status(200).json(dinero);
  } catch (error) {
    next(error);
  }
};

// Obtener clientes por zona
exports.getClientesPorZona = async (req, res, next) => {
  try {
    const clientes = await reporteService.getClientesPorZona();
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de créditos
exports.getEstadisticasCreditos = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const estadisticas = await reporteService.getEstadisticasCreditos(fechaDesde, fechaHasta);
    res.status(200).json(estadisticas);
  } catch (error) {
    next(error);
  }
};

// Obtener créditos por mes
exports.getCreditosPorMes = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const creditos = await reporteService.getCreditosPorMes(fechaDesde, fechaHasta);
    res.status(200).json(creditos);
  } catch (error) {
    next(error);
  }
};

// Obtener ventas por tipo de servicio
exports.getVentasPorTipoServicio = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const ventas = await reporteService.getVentasPorTipoServicio(fechaDesde, fechaHasta);
    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

// Obtener ventas por forma de pago
exports.getVentasPorFormaPago = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const ventas = await reporteService.getVentasPorFormaPago(fechaDesde, fechaHasta);
    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

// Obtener resumen general
exports.getResumenGeneral = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const resumen = await reporteService.getResumenGeneral(fechaDesde, fechaHasta);
    res.status(200).json(resumen);
  } catch (error) {
    next(error);
  }
};

