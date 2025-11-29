const express = require('express')
const router = express.Router()
const tipoFormaPagoController = require('../controllers/tipoFormaPago.controller')
const { protect } = require('../middlewares/auth.middleware')

// Rutas públicas (para obtener lista de tipos)
router.get('/', tipoFormaPagoController.getAllTiposFormaPago)
router.get('/:id', tipoFormaPagoController.getTipoFormaPagoById)

// Rutas protegidas (solo administradores)
router.post('/', protect, tipoFormaPagoController.createTipoFormaPago)
router.put('/:id', protect, tipoFormaPagoController.updateTipoFormaPago)
router.delete('/:id', protect, tipoFormaPagoController.deleteTipoFormaPago)

module.exports = router

