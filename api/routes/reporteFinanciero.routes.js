const express = require('express');
const router = express.Router();
const reporteFinancieroController = require('../controllers/reporteFinanciero.controller');
const { protect } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de reportes financieros
router.get('/antiguedad-cartera', reporteFinancieroController.getAntiguedadCartera);
router.get('/top-mejores-pagadores', reporteFinancieroController.getTopMejoresPagadores);
router.get('/top-peores-pagadores', reporteFinancieroController.getTopPeoresPagadores);
router.get('/analisis-riesgo', reporteFinancieroController.getAnalisisRiesgo);
router.get('/clientes-visita-cobranza', reporteFinancieroController.getClientesParaVisitaCobranza);
router.get('/recordatorios-por-enviar', reporteFinancieroController.getRecordatoriosPorEnviar);
router.get('/transferencias-pendientes', reporteFinancieroController.getTransferenciasPendientesConfirmacion);
router.get('/clientes-limite-excedido', reporteFinancieroController.getClientesConLimiteExcedido);
router.get('/comparativo-cartera-ventas', reporteFinancieroController.getComparativoCarteraVentas);
router.get('/eficiencia-cobranza-repartidor', reporteFinancieroController.getEficienciaCobranzaPorRepartidor);
router.get('/analisis-tendencias-pago', reporteFinancieroController.getAnalisisTendenciasPago);
router.get('/proyeccion-flujo-caja', reporteFinancieroController.getProyeccionFlujoCaja);

module.exports = router;

