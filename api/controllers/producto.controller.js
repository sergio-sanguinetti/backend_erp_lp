const productoService = require('../../services/producto.service');

// Obtener todos los productos
exports.getAllProductos = async (req, res, next) => {
  try {
    const filtros = {
      categoria: req.query.categoria,
      activo: req.query.activo,
      sedeId: req.query.sedeId,
      updatedAfter: req.query.updatedAfter
    };

    const productos = await productoService.getAllProductos(filtros);
    res.status(200).json(productos);
  } catch (error) {
    next(error);
  }
};

// Obtener producto por ID
exports.getProductoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await productoService.findProductoById(id);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.status(200).json(producto);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo producto
exports.createProducto = async (req, res, next) => {
  try {
    // Verificar permisos - solo administradores pueden crear productos
    if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear productos.' });
    }

    // Normalizar categoría: convertir guiones a guiones bajos (solo si se proporciona)
    if (req.body.categoria && typeof req.body.categoria === 'string') {
      req.body.categoria = req.body.categoria.replace(/-/g, '_');
    }

    const producto = await productoService.createProducto(req.body);
    const productoData = { ...producto };

    res.status(201).json({
      message: 'Producto creado exitosamente.',
      producto: productoData
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar producto
exports.updateProducto = async (req, res, next) => {
  try {
    // Verificar permisos - solo administradores pueden actualizar productos
    if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar productos.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Normalizar categoría si se proporciona: convertir guiones a guiones bajos (solo si es string)
    if (updateData.categoria && typeof updateData.categoria === 'string') {
      updateData.categoria = updateData.categoria.replace(/-/g, '_');
    }

    const producto = await productoService.updateProducto(id, updateData);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const productoData = { ...producto };

    res.status(200).json({
      message: 'Producto actualizado exitosamente.',
      producto: productoData
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar producto
exports.deleteProducto = async (req, res, next) => {
  try {
    // Verificar permisos - solo administradores pueden eliminar productos
    if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar productos.' });
    }

    const { id } = req.params;
    const producto = await productoService.deleteProducto(id);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.status(200).json({
      message: 'Producto eliminado exitosamente.',
      producto: {
        id: producto.id,
        nombre: producto.nombre
      }
    });
  } catch (error) {
    next(error);
  }
};

