const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateProducto } = require('../middlewares/validation.middleware');
const { validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Rutas públicas (para obtener productos)
router.get('/', productoController.getAllProductos);
router.get('/:id', productoController.getProductoById);

// Rutas protegidas (solo administradores)
router.post(
  '/',
  protect,
  validateProducto,
  handleValidationErrors,
  productoController.createProducto
);
router.put(
  '/:id',
  protect,
  validateProducto,
  handleValidationErrors,
  productoController.updateProducto
);
router.delete('/:id', protect, productoController.deleteProducto);

module.exports = router;

