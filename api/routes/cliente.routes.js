const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas de clientes
router.get('/', clienteController.getAllClientes);
router.get('/:id', clienteController.getClienteById);
router.post('/', protect, clienteController.createCliente);
router.put('/:id', protect, clienteController.updateCliente);
router.delete('/:id', protect, clienteController.deleteCliente);

// Rutas de domicilios
router.get('/:clienteId/domicilios', clienteController.getDomiciliosByCliente);
router.post('/:clienteId/domicilios', protect, clienteController.createDomicilio);
router.put('/domicilios/:id', protect, clienteController.updateDomicilio);
router.delete('/domicilios/:id', protect, clienteController.deleteDomicilio);

module.exports = router;

