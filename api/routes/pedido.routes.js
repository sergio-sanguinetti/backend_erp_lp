const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener pedidos)
router.get('/', protect, pedidoController.getAllPedidos);
router.get('/:id', protect, pedidoController.getPedidoById);

// Rutas protegidas (solo administradores)
router.post('/', protect, pedidoController.createPedido);
router.put('/:id', protect, pedidoController.updatePedido);
router.delete('/:id', protect, pedidoController.deletePedido);

module.exports = router;

