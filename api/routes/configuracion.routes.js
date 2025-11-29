const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracion.controller');
const { protect } = require('../middlewares/auth.middleware');

// Ruta pública (para obtener la configuración)
router.get('/', configuracionController.getConfiguracion);

// Ruta protegida (solo administradores pueden actualizar)
router.put('/', protect, configuracionController.updateConfiguracion);

module.exports = router;

