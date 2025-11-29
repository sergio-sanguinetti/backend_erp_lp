const categoriaProductoService = require('../../services/categoriaProducto.service');

// Obtener todas las categorías
exports.getAllCategorias = async (req, res, next) => {
    try {
        const filtros = {
            activa: req.query.activa
        };
        const categorias = await categoriaProductoService.getAllCategorias(filtros);
        res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
};

// Obtener categoría por ID
exports.getCategoriaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const categoria = await categoriaProductoService.findCategoriaById(id);
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
};

// Crear nueva categoría
exports.createCategoria = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear categorías.' });
        }

        const categoria = await categoriaProductoService.createCategoria(req.body);
        res.status(201).json({
            message: 'Categoría creada exitosamente.',
            categoria: categoria
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar categoría
exports.updateCategoria = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar categorías.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const categoria = await categoriaProductoService.updateCategoria(id, updateData);
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.status(200).json({
            message: 'Categoría actualizada exitosamente.',
            categoria: categoria
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar categoría
exports.deleteCategoria = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar categorías.' });
        }

        const { id } = req.params;
        const categoria = await categoriaProductoService.deleteCategoria(id);
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.status(200).json({
            message: 'Categoría eliminada exitosamente.',
            categoria: {
                id: categoria.id,
                nombre: categoria.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};


