const config = require('../config');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;

    res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        // Solo mostrar el stack de error en desarrollo
        stack: config.nodeEnv === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;