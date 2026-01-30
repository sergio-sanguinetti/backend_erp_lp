const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');

router.get('/resumen', ventasController.getResumen);
router.get('/corte/pipas', ventasController.getCortePipas);
router.get('/corte/cilindros', ventasController.getCorteCilindros);

module.exports = router;
