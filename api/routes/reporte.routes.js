const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const { protect } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de reportes
router.get('/ventas-por-mes', reporteController.getVentasPorMes);
router.get('/cortes-por-mes', reporteController.getCortesPorMes);
router.get('/dinero-entregado-por-cortes', reporteController.getDineroEntregadoPorCortes);
router.get('/clientes-por-zona', reporteController.getClientesPorZona);
router.get('/estadisticas-creditos', reporteController.getEstadisticasCreditos);
router.get('/creditos-por-mes', reporteController.getCreditosPorMes);
router.get('/ventas-por-tipo-servicio', reporteController.getVentasPorTipoServicio);
router.get('/ventas-por-forma-pago', reporteController.getVentasPorFormaPago);
router.get('/resumen-general', reporteController.getResumenGeneral);

module.exports = router;


