const usuarioService = require('../../services/usuario.service');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const config = require('../../config');

// --- FUNCIÓN MODIFICADA ---
// Ahora acepta el objeto de usuario completo para acceder a su ID y rol.
const generateToken = (usuario, requires2FA = false) => {
    // Se añade el 'rol', 'nombres' y 'email' al payload del token
    const payload = {
        id: usuario.id || usuario._id, // Compatible con Prisma (id) y Mongoose (_id)
        rol: usuario.rol,
        nombres: usuario.nombres,
        apellidoPaterno: usuario.apellidoPaterno,
        apellidoMaterno: usuario.apellidoMaterno,
        email: usuario.email
    };

    if (requires2FA) {
        payload.requires2FA = true;
    }

    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: requires2FA ? '10m' : config.jwtExpiresIn, // Token corto para 2FA
    });
};

// Registrar un nuevo usuario
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const usuario = await usuarioService.createUsuario(req.body);
        const usuarioData = { ...usuario };
        delete usuarioData.password;
        delete usuarioData.twoFactorSecret;

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            usuario: usuarioData,
            // --- CAMBIO AQUÍ: Se pasa el objeto 'usuario' completo ---
            token: generateToken(usuario),
        });
    } catch (error) {
        next(error);
    }
};

// Iniciar sesión (Paso 1: email y contraseña)
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, proporcione email y contraseña.' });
    }

    try {
        const usuario = await usuarioService.findUsuarioByEmail(email);
        if (!usuario || !(await usuarioService.comparePassword(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Si 2FA está habilitado, enviar un token temporal
        if (usuario.isTwoFactorEnabled) {
            return res.status(200).json({
                message: 'Verificación en dos pasos requerida.',
                requires2FA: true,
                // --- CAMBIO AQUÍ: Se pasa el objeto 'usuario' y el flag de 2FA ---
                token: generateToken(usuario, true),
            });
        }

        // Si 2FA no está habilitado, iniciar sesión directamente
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            // --- CAMBIO AQUÍ: Se pasa el objeto 'usuario' completo ---
            token: generateToken(usuario),
        });
    } catch (error) {
        next(error);
    }
};

// Iniciar sesión (Paso 2: Verificar token 2FA)
exports.verifyLogin2FA = async (req, res, next) => {
    const { token2FA } = req.body;
    const userId = req.user.id;

    try {
        const usuario = await usuarioService.findUsuarioById(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const isVerified = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token2FA,
        });

        if (!isVerified) {
            return res.status(401).json({ message: 'Token 2FA inválido.' });
        }

        // Token 2FA correcto, generar token de sesión final
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            // --- CAMBIO AQUÍ: Se pasa el objeto 'usuario' completo ---
            token: generateToken(usuario),
        });
    } catch (error) {
        next(error);
    }
};

// Generar secreto y QR para configurar 2FA
exports.setup2FA = async (req, res, next) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `${config.appName} (${req.user.email})`,
        });

        await usuarioService.updateUsuario(req.user.id, { twoFactorSecret: secret.base32 });

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return next(new Error('No se pudo generar el código QR.'));
            }
            res.status(200).json({
                message: 'Escanea este código QR con tu app de autenticación.',
                secret: secret.base32,
                qrCodeUrl: data_url,
            });
        });
    } catch (error) {
        next(error);
    }
};

// Verificar el token y habilitar 2FA
exports.verifyAndEnable2FA = async (req, res, next) => {
    const { token2FA } = req.body;
    const userId = req.user.id;

    try {
        // Obtener el usuario actualizado de la base de datos para verificar el secreto
        const usuario = await usuarioService.findUsuarioById(userId);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (!usuario.twoFactorSecret) {
            return res.status(400).json({ message: 'Primero debes generar un secreto 2FA.' });
        }

        const isVerified = speakeasy.totp.verify({
            secret: usuario.twoFactorSecret,
            encoding: 'base32',
            token: token2FA,
            window: 2 // Permitir un margen de 2 períodos (60 segundos) para compensar desfases de tiempo
        });

        if (!isVerified) {
            return res.status(401).json({ message: 'Token 2FA inválido.' });
        }

        await usuarioService.updateUsuario(usuario.id, { isTwoFactorEnabled: true });

        res.status(200).json({ message: 'La autenticación de dos factores ha sido habilitada exitosamente.' });
    } catch (error) {
        next(error);
    }
};

// Deshabilitar 2FA
exports.disable2FA = async (req, res, next) => {
    try {
        await usuarioService.updateUsuario(req.user.id, {
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
        });
        res.status(200).json({ message: 'La autenticación de dos factores ha sido deshabilitada.' });
    } catch (error) {
        next(error);
    }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res, next) => {
    try {
        const usuario = await usuarioService.findUsuarioById(req.user.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const profileData = { ...usuario };
        delete profileData.password;
        delete profileData.twoFactorSecret;
        
        res.status(200).json(profileData);
    } catch (error) {
        next(error);
    }
};

// Obtener todos los usuarios (solo administradores)
exports.getAllUsuarios = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador o superAdministrador
        if (req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver esta información.' });
        }

        // Obtener filtros de los query parameters
        const filtros = {};
        if (req.query.rol) filtros.rol = req.query.rol;
        if (req.query.estado) filtros.estado = req.query.estado;
        if (req.query.sede) filtros.sede = req.query.sede;

        // Si el usuario no es superAdministrador, filtrar por su sede automáticamente
        if (req.user.rol === 'administrador' && req.user.sede && !filtros.sede) {
            filtros.sede = req.user.sede;
        }

        const usuarios = await usuarioService.getAllUsuarios(filtros);
        const usuariosData = usuarios.map(usuario => {
            const userData = { ...usuario };
            delete userData.password;
            delete userData.twoFactorSecret;
            return userData;
        });

        res.status(200).json(usuariosData);
    } catch (error) {
        next(error);
    }
};

// Actualizar perfil del usuario actual
exports.updateProfile = async (req, res, next) => {
    try {
        const updateData = req.body;
        const userId = req.user.id;

        // No permitir cambiar campos sensibles desde el perfil
        delete updateData.password;
        delete updateData.rol;
        delete updateData.estado;
        delete updateData.twoFactorSecret;
        delete updateData.isTwoFactorEnabled;
        delete updateData.sede;

        // Validar que solo se actualicen campos permitidos
        const allowedFields = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'telefono'];
        const filteredData = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        // No permitir cambiar el email desde aquí (debe ser un proceso separado)
        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
        }

        const usuario = await usuarioService.updateUsuario(userId, filteredData);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuarioData = { ...usuario };
        delete usuarioData.password;
        delete usuarioData.twoFactorSecret;

        res.status(200).json({
            message: 'Perfil actualizado exitosamente.',
            usuario: usuarioData
        });
    } catch (error) {
        next(error);
    }
};

// Obtener usuario por ID (solo administradores)
exports.getUsuarioById = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver esta información.' });
        }

        const usuario = await usuarioService.findUsuarioById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuarioData = { ...usuario };
        delete usuarioData.password;
        delete usuarioData.twoFactorSecret;

        res.status(200).json(usuarioData);
    } catch (error) {
        next(error);
    }
};

// Actualizar usuario (solo administradores)
exports.updateUsuario = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar usuarios.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        // No permitir cambiar la contraseña desde aquí
        delete updateData.password;
        delete updateData.twoFactorSecret;

        const usuario = await usuarioService.updateUsuario(id, updateData);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuarioData = { ...usuario };
        delete usuarioData.password;
        delete usuarioData.twoFactorSecret;

        res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            usuario: usuarioData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar usuario (solo administradores)
exports.deleteUsuario = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar usuarios.' });
        }

        const { id } = req.params;

        // No permitir que un administrador se elimine a sí mismo
        if (id === req.user.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
        }

        const usuario = await usuarioService.deleteUsuario(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: 'Usuario eliminado exitosamente.',
            usuario: {
                id: usuario.id,
                nombres: usuario.nombres,
                apellidoPaterno: usuario.apellidoPaterno,
                apellidoMaterno: usuario.apellidoMaterno,
                email: usuario.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// Obtener estadísticas de usuarios (solo administradores)
exports.getUsuariosStats = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver esta información.' });
        }

        const stats = await usuarioService.getUsuariosStats();
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};
