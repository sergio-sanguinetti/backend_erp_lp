const jwt = require('jsonwebtoken');
const config = require('../../config');

exports.protect = async (req, res, next) => {
    let token;

    console.log('Auth middleware - Headers:', req.headers);
    console.log('Auth middleware - Authorization header:', req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Auth middleware - Token extraído:', token ? token.substring(0, 20) + '...' : 'No token');
    }

    if (!token) {
        console.log('Auth middleware - No se encontró token');
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }

    try {
        console.log('Auth middleware - Verificando JWT con secret:', config.jwtSecret ? 'Configurado' : 'No configurado');
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log('Auth middleware - JWT decodificado:', decoded);
        
        // Si es un token de 2FA, solo permitir acceso a la ruta de verificación
        if (decoded.requires2FA && req.path !== '/login/verify-2fa') {
            console.log('Auth middleware - Se requiere verificación 2FA');
            return res.status(401).json({ message: 'Se requiere verificación 2FA para continuar.' });
        }

        // En desarrollo, crear un usuario mock si no hay MongoDB
        if (config.nodeEnv === 'development') {
            req.user = {
                id: decoded.id || 'mock_user_id',
                email: decoded.email || 'mock@example.com',
                rol: decoded.rol || 'repartidor'
            };
            console.log('Auth middleware - Usuario mock creado para desarrollo:', req.user);
        } else {
            // En producción, buscar el usuario real en la base de datos
            const usuarioService = require('../../services/usuario.service');
            const usuario = await usuarioService.findUsuarioById(decoded.id);
            
            if (!usuario) {
                console.log('Auth middleware - Usuario no encontrado');
                return res.status(401).json({ message: 'Usuario no encontrado.' });
            }

            // Convertir a objeto plano y eliminar password
            req.user = {
                id: usuario.id,
                email: usuario.email,
                nombres: usuario.nombres,
                apellidoPaterno: usuario.apellidoPaterno,
                apellidoMaterno: usuario.apellidoMaterno,
                rol: usuario.rol,
                estado: usuario.estado,
                sede: usuario.sede,
                telefono: usuario.telefono,
                isTwoFactorEnabled: usuario.isTwoFactorEnabled,
                twoFactorSecret: usuario.twoFactorSecret,
                fechaRegistro: usuario.fechaRegistro
            };
        }

        console.log('Auth middleware - Usuario autenticado:', req.user.email);
        next();
    } catch (error) {
        console.log('Auth middleware - Error al verificar JWT:', error.message);
        // Manejar errores de token (expirado, inválido)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado.' });
        }
        return res.status(401).json({ message: 'No autorizado, token inválido.' });
    }
};