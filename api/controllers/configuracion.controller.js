const configuracionService = require('../../services/configuracion.service');

// Obtener la configuración única
exports.getConfiguracion = async (req, res, next) => {
  try {
    const configuracion = await configuracionService.getConfiguracion();
    res.status(200).json(configuracion);
  } catch (error) {
    next(error);
  }
};

// Actualizar la configuración única
exports.updateConfiguracion = async (req, res, next) => {
  try {
    // Verificar permisos - solo administradores pueden actualizar configuraciones
    if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar configuraciones.' });
    }

    const configuracion = await configuracionService.updateConfiguracion(req.body);
    res.status(200).json({
      message: 'Configuración actualizada exitosamente.',
      configuracion
    });
  } catch (error) {
    next(error);
  }
};

