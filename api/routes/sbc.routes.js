const express = require('express');
const router = express.Router();
const sbcController = require('../controllers/sbc.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, sbcController.getPagosSbc);
router.put('/:id/confirmar-oficina', protect, sbcController.confirmarOficina);
router.put('/:id/confirmar-sanluis', protect, sbcController.confirmarSanLuis);
router.put('/:id/rechazar', protect, sbcController.rechazarSbc);
router.put('/:id/reactivar', protect, sbcController.reactivarPago);

module.exports = router;
