const express = require('express');
const router = express.Router();
const formaPagoController = require('../controllers/formaPago.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener lista de formas de pago)
router.get('/', formaPagoController.getAllFormasPago);
router.get('/:id', formaPagoController.getFormaPagoById);

// Rutas protegidas (solo administradores)
router.post('/', protect, formaPagoController.createFormaPago);
router.put('/:id', protect, formaPagoController.updateFormaPago);
router.delete('/:id', protect, formaPagoController.deleteFormaPago);

module.exports = router;

