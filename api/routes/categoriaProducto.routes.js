const express = require('express');
const router = express.Router();
const categoriaProductoController = require('../controllers/categoriaProducto.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas de categorías de productos
router.get('/', categoriaProductoController.getAllCategorias);
router.get('/:id', categoriaProductoController.getCategoriaById);
router.post('/', protect, categoriaProductoController.createCategoria);
router.put('/:id', protect, categoriaProductoController.updateCategoria);
router.delete('/:id', protect, categoriaProductoController.deleteCategoria);

module.exports = router;



