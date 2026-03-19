const ventasService = require('../../services/ventas.service');
const corteCajaController = require('./corteCaja.controller');

exports.getResumen = async (req, res) => {
  try {
    const { sedeId, fechaDesde, fechaHasta } = req.query;
    const resumen = await ventasService.getResumenDia(sedeId || null, fechaDesde || null, fechaHasta || null);
    res.json(resumen);
  } catch (error) {
    console.error('Error en getResumen ventas:', error);
    res.status(500).json({ message: error.message || 'Error al obtener resumen de ventas' });
  }
};

exports.getCortePipas = corteCajaController.getCortePipas;
exports.getCorteCilindros = corteCajaController.getCorteCilindros;

exports.getResumenPorRepartidor = async (req, res) => {
  try {
    const { sedeId, fechaDesde, fechaHasta } = req.query;
    const data = await ventasService.getResumenPorRepartidor(sedeId || null, fechaDesde || null, fechaHasta || null);
    res.json(data);
  } catch (error) {
    console.error('Error en getResumenPorRepartidor:', error);
    res.status(500).json({ message: error.message || 'Error al obtener resumen por repartidor' });
  }
};
