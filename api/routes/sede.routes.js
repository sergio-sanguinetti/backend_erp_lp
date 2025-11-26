const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sede.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener lista de sedes activas)
router.get('/', sedeController.getAllSedes);
router.get('/:id', sedeController.getSedeById);

// Rutas protegidas (solo administradores)
router.post('/', protect, sedeController.createSede);
router.put('/:id', protect, sedeController.updateSede);
router.delete('/:id', protect, sedeController.deleteSede);

module.exports = router;

