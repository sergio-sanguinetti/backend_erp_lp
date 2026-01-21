const reporteService = require('../../services/reporte.service');

exports.getVentasPorMes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const ventas = await reporteService.getVentasPorMes(fechaDesde, fechaHasta, sedeId);
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas por mes:', error);
    res.status(500).json({ message: 'Error al obtener ventas por mes', error: error.message });
  }
};

exports.getCortesPorMes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const cortes = await reporteService.getCortesPorMes(fechaDesde, fechaHasta, sedeId);
    res.json(cortes);
  } catch (error) {
    console.error('Error al obtener cortes por mes:', error);
    res.status(500).json({ message: 'Error al obtener cortes por mes', error: error.message });
  }
};

exports.getDineroEntregadoPorCortes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const dinero = await reporteService.getDineroEntregadoPorCortes(fechaDesde, fechaHasta, sedeId);
    res.json(dinero);
  } catch (error) {
    console.error('Error al obtener dinero entregado por cortes:', error);
    res.status(500).json({ message: 'Error al obtener dinero entregado por cortes', error: error.message });
  }
};

exports.getClientesPorZona = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const clientes = await reporteService.getClientesPorZona(sedeId);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes por zona:', error);
    res.status(500).json({ message: 'Error al obtener clientes por zona', error: error.message });
  }
};

exports.getEstadisticasCreditos = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const estadisticas = await reporteService.getEstadisticasCreditos(sedeId);
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas de créditos:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas de créditos', error: error.message });
  }
};

exports.getCreditosPorMes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const creditos = await reporteService.getCreditosPorMes(fechaDesde, fechaHasta, sedeId);
    res.json(creditos);
  } catch (error) {
    console.error('Error al obtener créditos por mes:', error);
    res.status(500).json({ message: 'Error al obtener créditos por mes', error: error.message });
  }
};

exports.getVentasPorTipoServicio = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const ventas = await reporteService.getVentasPorTipoServicio(fechaDesde, fechaHasta, sedeId);
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas por tipo de servicio:', error);
    res.status(500).json({ message: 'Error al obtener ventas por tipo de servicio', error: error.message });
  }
};

exports.getVentasPorFormaPago = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const ventas = await reporteService.getVentasPorFormaPago(fechaDesde, fechaHasta, sedeId);
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas por forma de pago:', error);
    res.status(500).json({ message: 'Error al obtener ventas por forma de pago', error: error.message });
  }
};

exports.getResumenGeneral = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const resumen = await reporteService.getResumenGeneral(fechaDesde, fechaHasta, sedeId);
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen general:', error);
    res.status(500).json({ message: 'Error al obtener resumen general', error: error.message });
  }
};


