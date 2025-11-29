const express = require('express');
const router = express.Router();
const descuentoRepartidorController = require('../controllers/descuentoRepartidor.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas de descuentos por repartidor
router.get('/', descuentoRepartidorController.getAllDescuentos);
router.get('/repartidor/:repartidorId', descuentoRepartidorController.getDescuentoByRepartidor);
router.get('/:id', descuentoRepartidorController.getDescuentoById);
router.post('/', protect, descuentoRepartidorController.createDescuento);
router.put('/:id', protect, descuentoRepartidorController.updateDescuento);
router.delete('/:id', protect, descuentoRepartidorController.deleteDescuento);

module.exports = router;



