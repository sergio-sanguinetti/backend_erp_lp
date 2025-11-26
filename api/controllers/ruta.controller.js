const rutaService = require('../../services/ruta.service');

// Obtener todas las rutas
exports.getAllRutas = async (req, res, next) => {
    try {
        const filtros = {
            nombre: req.query.nombre,
            zona: req.query.zona,
            activa: req.query.activa,
            repartidor: req.query.repartidor
        };
        
        const rutas = await rutaService.getAllRutas(filtros);
        
        // Formatear respuesta para incluir repartidores como array
        const rutasFormateadas = rutas.map(ruta => ({
            ...ruta,
            repartidores: ruta.repartidores.map(ur => ur.usuario)
        }));
        
        res.status(200).json(rutasFormateadas);
    } catch (error) {
        next(error);
    }
};

// Obtener ruta por ID
exports.getRutaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ruta = await rutaService.findRutaById(id);
        
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        // Formatear respuesta para incluir repartidores como array
        const rutaFormateada = {
            ...ruta,
            repartidores: ruta.repartidores.map(ur => ur.usuario)
        };

        res.status(200).json(rutaFormateada);
    } catch (error) {
        next(error);
    }
};

// Crear nueva ruta
exports.createRuta = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o gestor
        if (req.user.rol !== 'administrador' && req.user.rol !== 'gestor') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores y gestores pueden crear rutas.' });
        }

        // Agregar información del usuario que crea
        const rutaData = {
            ...req.body,
            repartidoresIds: req.body.repartidoresIds || [],
            usuarioCreacion: req.user.nombres || req.user.email || 'Sistema',
            usuarioModificacion: req.user.nombres || req.user.email || 'Sistema'
        };

        const ruta = await rutaService.createRuta(rutaData);
        
        // Formatear respuesta
        const rutaFormateada = {
            ...ruta,
            repartidores: ruta.repartidores.map(ur => ur.usuario)
        };

        res.status(201).json({
            message: 'Ruta creada exitosamente.',
            ruta: rutaFormateada
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar ruta
exports.updateRuta = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o gestor
        if (req.user.rol !== 'administrador' && req.user.rol !== 'gestor') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores y gestores pueden modificar rutas.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Agregar usuario que modifica
        if (req.user) {
            updateData.usuarioModificacion = req.user.nombres || req.user.email || 'Sistema';
        }

        // Asegurar que repartidoresIds sea un array
        if (updateData.repartidoresIds === undefined) {
            // Si no se envía, mantener los existentes
            const rutaActual = await rutaService.findRutaById(id);
            if (rutaActual) {
                updateData.repartidoresIds = rutaActual.repartidores.map(ur => ur.usuarioId);
            } else {
                updateData.repartidoresIds = [];
            }
        }

        const ruta = await rutaService.updateRuta(id, updateData);
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        // Formatear respuesta
        const rutaFormateada = {
            ...ruta,
            repartidores: ruta.repartidores.map(ur => ur.usuario)
        };

        res.status(200).json({
            message: 'Ruta actualizada exitosamente.',
            ruta: rutaFormateada
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar ruta
exports.deleteRuta = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o gestor
        if (req.user.rol !== 'administrador' && req.user.rol !== 'gestor') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores y gestores pueden eliminar rutas.' });
        }

        const { id } = req.params;
        const ruta = await rutaService.deleteRuta(id);
        
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        res.status(200).json({
            message: 'Ruta eliminada exitosamente.',
            ruta: {
                id: ruta.id,
                nombre: ruta.nombre,
                codigo: ruta.codigo
            }
        });
    } catch (error) {
        next(error);
    }
};

