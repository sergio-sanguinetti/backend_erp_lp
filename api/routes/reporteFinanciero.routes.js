const express = require('express');
const router = express.Router();
const reporteFinancieroController = require('../controllers/reporteFinanciero.controller');
const { protect } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Reportes Ejecutivos
router.get('/antiguedad-cartera', reporteFinancieroController.getAntiguedadCartera);
router.get('/top-mejores-pagadores', reporteFinancieroController.getTopMejoresPagadores);
router.get('/top-peores-pagadores', reporteFinancieroController.getTopPeoresPagadores);
router.get('/analisis-riesgo', reporteFinancieroController.getAnalisisRiesgo);

// Reportes Operativos
router.get('/clientes-visita-cobranza', reporteFinancieroController.getClientesVisitaCobranza);
router.get('/recordatorios-por-enviar', reporteFinancieroController.getRecordatoriosPorEnviar);
router.get('/transferencias-pendientes', reporteFinancieroController.getTransferenciasPendientes);
router.get('/clientes-limite-excedido', reporteFinancieroController.getClientesLimiteExcedido);

// Reportes Estratégicos
router.get('/comparativo-cartera-ventas', reporteFinancieroController.getComparativoCarteraVentas);
router.get('/eficiencia-cobranza-repartidor', reporteFinancieroController.getEficienciaCobranzaRepartidor);
router.get('/tendencias-pago', reporteFinancieroController.getTendenciasPago);
router.get('/proyeccion-flujo-caja', reporteFinancieroController.getProyeccionFlujoCaja);

module.exports = router;

