const express = require('express');
const router = express.Router();
const corteCajaController = require('../controllers/corteCaja.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/summary', protect, corteCajaController.getTodaySummary);
router.get('/check', protect, corteCajaController.checkCorte);
router.post('/', protect, corteCajaController.createCorte);
router.get('/', protect, corteCajaController.getAllCortes);
router.put('/:id/validate', protect, corteCajaController.validateCorte);

// Rutas para el sistema web (frontend)
router.get('/corte/pipas', corteCajaController.getCortePipas);
router.get('/corte/cilindros', corteCajaController.getCorteCilindros);

module.exports = router;








