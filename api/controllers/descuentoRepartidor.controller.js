const descuentoRepartidorService = require('../../services/descuentoRepartidor.service');

// Obtener todos los descuentos
exports.getAllDescuentos = async (req, res, next) => {
    try {
        const descuentos = await descuentoRepartidorService.getAllDescuentos();
        res.status(200).json(descuentos);
    } catch (error) {
        next(error);
    }
};

// Obtener descuento por ID
exports.getDescuentoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const descuento = await descuentoRepartidorService.findDescuentoById(id);
        
        if (!descuento) {
            return res.status(404).json({ message: 'Descuento no encontrado.' });
        }

        res.status(200).json(descuento);
    } catch (error) {
        next(error);
    }
};

// Obtener descuentos por repartidor (ahora retorna una lista)
exports.getDescuentoByRepartidor = async (req, res, next) => {
    try {
        const { repartidorId } = req.params;
        const descuentos = await descuentoRepartidorService.findDescuentoByRepartidor(repartidorId);
        
        // Retornar lista vacía si no hay descuentos en lugar de error 404
        res.status(200).json(descuentos || []);
    } catch (error) {
        next(error);
    }
};

// Crear nuevo descuento
exports.createDescuento = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear descuentos.' });
        }

        const descuento = await descuentoRepartidorService.createDescuento(req.body);
        res.status(201).json({
            message: 'Descuento creado exitosamente.',
            descuento: descuento
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar descuento
exports.updateDescuento = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar descuentos.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const descuento = await descuentoRepartidorService.updateDescuento(id, updateData);
        if (!descuento) {
            return res.status(404).json({ message: 'Descuento no encontrado.' });
        }

        res.status(200).json({
            message: 'Descuento actualizado exitosamente.',
            descuento: descuento
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar descuento
exports.deleteDescuento = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar descuentos.' });
        }

        const { id } = req.params;
        const descuento = await descuentoRepartidorService.deleteDescuento(id);
        
        if (!descuento) {
            return res.status(404).json({ message: 'Descuento no encontrado.' });
        }

        res.status(200).json({
            message: 'Descuento eliminado exitosamente.',
            descuento: {
                id: descuento.id,
                repartidorId: descuento.repartidorId
            }
        });
    } catch (error) {
        next(error);
    }
};


