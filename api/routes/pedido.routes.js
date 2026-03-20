const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener pedidos)
router.get('/sbc/pendientes', protect, pedidoController.getPedidosSBC);
router.get('/', protect, pedidoController.getAllPedidos);
router.get('/:id', protect, pedidoController.getPedidoById);

// Rutas protegidas (solo administradores)
router.post('/', protect, pedidoController.createPedido);
router.post('/cobrar-por-cobrar', protect, pedidoController.cobrarPorCobrar);
router.put('/:id', protect, pedidoController.updatePedido);
router.delete('/:id', protect, pedidoController.deletePedido);

router.put('/:id/pagos', protect, pedidoController.updatePagosPedido);
router.put('/:id/cancelar', protect, pedidoController.cancelarPedido);



// Rutas SBC (Salvo Buen Cobro)
router.put('/:id/sbc', protect, pedidoController.updateEstadoSBC);

module.exports = router;
