const sedeService = require('../../services/sede.service');

// Obtener todas las sedes
exports.getAllSedes = async (req, res, next) => {
    try {
        const sedes = await sedeService.getAllSedes();
        res.status(200).json(sedes);
    } catch (error) {
        next(error);
    }
};

// Obtener sede por ID
exports.getSedeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sede = await sedeService.findSedeById(id);
        
        if (!sede) {
            return res.status(404).json({ message: 'Sede no encontrada.' });
        }

        res.status(200).json(sede);
    } catch (error) {
        next(error);
    }
};

// Crear nueva sede
exports.createSede = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear sedes.' });
        }

        const sede = await sedeService.createSede(req.body);
        const sedeData = { ...sede };

        res.status(201).json({
            message: 'Sede creada exitosamente.',
            sede: sedeData
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar sede
exports.updateSede = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar sedes.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const sede = await sedeService.updateSede(id, updateData);
        if (!sede) {
            return res.status(404).json({ message: 'Sede no encontrada.' });
        }

        const sedeData = { ...sede };

        res.status(200).json({
            message: 'Sede actualizada exitosamente.',
            sede: sedeData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar sede
exports.deleteSede = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar sedes.' });
        }

        const { id } = req.params;
        const sede = await sedeService.deleteSede(id);
        
        if (!sede) {
            return res.status(404).json({ message: 'Sede no encontrada.' });
        }

        res.status(200).json({
            message: 'Sede eliminada exitosamente.',
            sede: {
                id: sede.id,
                nombre: sede.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};

