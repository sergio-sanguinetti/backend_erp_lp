// services/usuario.service.js

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.createUsuario = async (usuarioData) => {
    // Verificar si el email ya existe
    const existingUsuario = await prisma.usuario.findUnique({
        where: { email: usuarioData.email.toLowerCase() }
    });
    
    if (existingUsuario) {
        const error = new Error('El correo electrónico ya está en uso.');
        error.status = 409; // Conflict
        throw error;
    }

    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(usuarioData.password, salt);

    // Si el rol no es repartidor, establecer tipoRepartidor en null
    const tipoRepartidor = (usuarioData.rol === 'repartidor' && usuarioData.tipoRepartidor) 
        ? usuarioData.tipoRepartidor 
        : null;

    const nuevoUsuario = await prisma.usuario.create({
        data: {
            nombres: usuarioData.nombres,
            apellidoPaterno: usuarioData.apellidoPaterno,
            apellidoMaterno: usuarioData.apellidoMaterno,
            email: usuarioData.email.toLowerCase(),
            password: hashedPassword,
            telefono: usuarioData.telefono || null,
            rol: usuarioData.rol || 'repartidor',
            tipoRepartidor: tipoRepartidor,
            estado: usuarioData.estado || 'activo',
            sede: usuarioData.sede || null,
        }
    });

    return nuevoUsuario;
};

exports.findUsuarioByEmail = async (email) => {
    return await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() }
    });
};

exports.findUsuarioById = async (id) => {
    return await prisma.usuario.findUnique({
        where: { id }
    });
};

exports.updatePushToken = async (userId, pushToken) => {
    return await prisma.usuario.update({
        where: { id: userId },
        data: { pushToken: pushToken || null }
    });
};

exports.updateUsuario = async (id, updateData) => {
    // Si se actualiza la contraseña, hashearla
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Si se actualiza el email, convertirlo a lowercase
    if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
    }

    // Si el rol no es repartidor, establecer tipoRepartidor en null
    if (updateData.rol && updateData.rol !== 'repartidor') {
        updateData.tipoRepartidor = null;
    }

    // Si tipoRepartidor está presente pero el rol no es repartidor, ignorarlo
    if (updateData.tipoRepartidor && updateData.rol && updateData.rol !== 'repartidor') {
        delete updateData.tipoRepartidor;
    }

    return await prisma.usuario.update({
        where: { id },
        data: updateData
    });
};

// Obtener todos los usuarios con filtros opcionales
exports.getAllUsuarios = async (filtros = {}) => {
    const where = {};
    
    // Filtrar por rol
    if (filtros.rol) {
        where.rol = filtros.rol;
    }
    
    // Filtrar por estado
    if (filtros.estado) {
        where.estado = filtros.estado;
    }
    
    // Filtrar por sede (puede ser nombre de sede o ID)
    // El campo sede en Usuario es un string que almacena el nombre de la sede
    if (filtros.sede) {
        // Buscar por el valor exacto (puede ser nombre como "SEDE 2" o ID)
        where.sede = filtros.sede;
    }
    
    return await prisma.usuario.findMany({
        where,
        orderBy: { fechaRegistro: 'desc' }
    });
};

// Eliminar usuario
exports.deleteUsuario = async (id) => {
    return await prisma.usuario.delete({
        where: { id }
    });
};

// Obtener estadísticas de usuarios
exports.getUsuariosStats = async () => {
    const totalUsuarios = await prisma.usuario.count();
    
    const usuariosPorRol = await prisma.usuario.groupBy({
        by: ['rol'],
        _count: {
            rol: true
        }
    });

    const usuariosActivos = await prisma.usuario.count({
        where: {
            isTwoFactorEnabled: true
        }
    });

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    
    const usuariosRecientes = await prisma.usuario.count({
        where: {
            fechaRegistro: {
                gte: fechaLimite
            }
        }
    });

    return {
        totalUsuarios,
        usuariosPorRol: usuariosPorRol.map(item => ({
            rol: item.rol,
            count: item._count.rol
        })),
        usuariosActivos,
        usuariosRecientes
    };
};

// Método helper para comparar contraseñas
exports.comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};
