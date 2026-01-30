const ventasService = require('../../services/ventas.service');
const corteCajaController = require('./corteCaja.controller');

exports.getResumen = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const resumen = await ventasService.getResumenDia(sedeId || null);
    res.json(resumen);
  } catch (error) {
    console.error('Error en getResumen ventas:', error);
    res.status(500).json({ message: error.message || 'Error al obtener resumen de ventas' });
  }
};

exports.getCortePipas = corteCajaController.getCortePipas;
exports.getCorteCilindros = corteCajaController.getCorteCilindros;
