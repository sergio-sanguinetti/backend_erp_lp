const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/ruta.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener lista de rutas)
router.get('/', rutaController.getAllRutas);
router.get('/:id', rutaController.getRutaById);

// Rutas protegidas (solo administradores y gestores)
router.post('/', protect, rutaController.createRuta);
router.put('/:id', protect, rutaController.updateRuta);
router.delete('/:id', protect, rutaController.deleteRuta);

module.exports = router;

