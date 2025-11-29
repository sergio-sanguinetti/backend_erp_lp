const formaPagoService = require('../../services/formaPago.service');

// Obtener todas las formas de pago
exports.getAllFormasPago = async (req, res, next) => {
    try {
        const filtros = {
            nombre: req.query.nombre,
            tipo: req.query.tipo,
            activa: req.query.activa
        };
        
        const formasPago = await formaPagoService.getAllFormasPago(filtros);
        res.status(200).json(formasPago);
    } catch (error) {
        next(error);
    }
};

// Obtener forma de pago por ID
exports.getFormaPagoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const formaPago = await formaPagoService.findFormaPagoById(id);
        
        if (!formaPago) {
            return res.status(404).json({ message: 'Forma de pago no encontrada.' });
        }

        res.status(200).json(formaPago);
    } catch (error) {
        next(error);
    }
};

// Crear nueva forma de pago
exports.createFormaPago = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear formas de pago.' });
        }

        // Agregar información del usuario que crea
        const formaPagoData = {
            ...req.body,
            usuarioCreacion: req.user.nombres || req.user.email || 'Sistema',
            usuarioModificacion: req.user.nombres || req.user.email || 'Sistema'
        };

        const formaPago = await formaPagoService.createFormaPago(formaPagoData);
        const formaPagoResponse = { ...formaPago };

        res.status(201).json({
            message: 'Forma de pago creada exitosamente.',
            formaPago: formaPagoResponse
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar forma de pago
exports.updateFormaPago = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar formas de pago.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Agregar usuario que modifica
        if (req.user) {
            updateData.usuarioModificacion = req.user.nombres || req.user.email || 'Sistema';
        }

        const formaPago = await formaPagoService.updateFormaPago(id, updateData);
        if (!formaPago) {
            return res.status(404).json({ message: 'Forma de pago no encontrada.' });
        }

        const formaPagoData = { ...formaPago };

        res.status(200).json({
            message: 'Forma de pago actualizada exitosamente.',
            formaPago: formaPagoData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar forma de pago
exports.deleteFormaPago = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar formas de pago.' });
        }

        const { id } = req.params;
        const formaPago = await formaPagoService.deleteFormaPago(id);
        
        if (!formaPago) {
            return res.status(404).json({ message: 'Forma de pago no encontrada.' });
        }

        res.status(200).json({
            message: 'Forma de pago eliminada exitosamente.',
            formaPago: {
                id: formaPago.id,
                nombre: formaPago.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};

