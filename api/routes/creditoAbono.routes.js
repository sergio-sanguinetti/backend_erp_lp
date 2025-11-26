// api/routes/creditoAbono.routes.js
const express = require('express');
const router = express.Router();
const creditoAbonoController = require('../controllers/creditoAbono.controller');
const { protect } = require('../middlewares/auth.middleware');

// Notas de Crédito
router.get('/notas-credito', protect, creditoAbonoController.getAllNotasCredito);
router.get('/notas-credito/:id', protect, creditoAbonoController.getNotaCreditoById);
router.post('/notas-credito', protect, creditoAbonoController.createNotaCredito);
router.put('/notas-credito/:id', protect, creditoAbonoController.updateNotaCredito);
router.delete('/notas-credito/:id', protect, creditoAbonoController.deleteNotaCredito);

// Pagos
router.get('/pagos', protect, creditoAbonoController.getAllPagos);
router.get('/pagos/:id', protect, creditoAbonoController.getPagoById);
router.post('/pagos', protect, creditoAbonoController.createPago);
router.put('/pagos/:id/estado', protect, creditoAbonoController.updatePagoEstado);

// Resumen de Cartera
router.get('/resumen-cartera', protect, creditoAbonoController.getResumenCartera);

// Clientes con Crédito
router.get('/clientes-credito', protect, creditoAbonoController.getClientesCredito);

// Historial de Límites
router.get('/historial-limites', protect, creditoAbonoController.getHistorialLimites);
router.put('/clientes/:clienteId/limite-credito', protect, creditoAbonoController.updateLimiteCredito);

module.exports = router;

