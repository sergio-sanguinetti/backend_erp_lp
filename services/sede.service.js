// services/sede.service.js

const { prisma } = require('../config/database');

exports.createSede = async (sedeData) => {
    // Verificar si el nombre ya existe
    const existingSede = await prisma.sede.findFirst({
        where: { nombre: sedeData.nombre }
    });
    
    if (existingSede) {
        const error = new Error('Ya existe una sede con ese nombre.');
        error.status = 409; // Conflict
        throw error;
    }

    const nuevaSede = await prisma.sede.create({
        data: {
            nombre: sedeData.nombre,
            direccion: sedeData.direccion,
            telefono: sedeData.telefono,
            email: sedeData.email.toLowerCase(),
            estado: sedeData.estado || 'activa',
        }
    });

    return nuevaSede;
};

exports.findSedeById = async (id) => {
    return await prisma.sede.findUnique({
        where: { id }
    });
};

exports.getAllSedes = async () => {
    return await prisma.sede.findMany({
        orderBy: { fechaCreacion: 'desc' }
    });
};

exports.updateSede = async (id, updateData) => {
    // Si se actualiza el email, convertirlo a lowercase
    if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
    }

    // Verificar si el nombre ya existe en otra sede
    if (updateData.nombre) {
        const existingSede = await prisma.sede.findFirst({
            where: {
                nombre: updateData.nombre,
                id: { not: id }
            }
        });
        
        if (existingSede) {
            const error = new Error('Ya existe una sede con ese nombre.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    return await prisma.sede.update({
        where: { id },
        data: updateData
    });
};

exports.deleteSede = async (id) => {
    // Obtener la sede para conocer su nombre
    const sede = await prisma.sede.findUnique({
        where: { id }
    });

    if (!sede) {
        const error = new Error('Sede no encontrada.');
        error.status = 404;
        throw error;
    }

    // Verificar si hay usuarios asociados a esta sede (por nombre)
    const usuariosConSede = await prisma.usuario.findFirst({
        where: {
            sede: sede.nombre
        }
    });

    if (usuariosConSede) {
        const error = new Error('No se puede eliminar la sede porque tiene usuarios asociados.');
        error.status = 400; // Bad Request
        throw error;
    }

    return await prisma.sede.delete({
        where: { id }
    });
};

