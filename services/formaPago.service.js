// services/formaPago.service.js

const { prisma } = require('../config/database');

exports.createFormaPago = async (formaPagoData) => {
    // Verificar si el nombre ya existe
    const existingFormaPago = await prisma.formaPago.findFirst({
        where: { nombre: formaPagoData.nombre }
    });
    
    if (existingFormaPago) {
        const error = new Error('Ya existe una forma de pago con ese nombre.');
        error.status = 409; // Conflict
        throw error;
    }

    // Verificar que la sede existe si se proporciona
    if (formaPagoData.sedeId) {
        const sede = await prisma.sede.findUnique({
            where: { id: formaPagoData.sedeId }
        });
        if (!sede) {
            const error = new Error('La sede especificada no existe.');
            error.status = 404;
            throw error;
        }
    }

    // Preparar datos de sedes
    const sedesIds = formaPagoData.sedesIds || (formaPagoData.sedeId ? [formaPagoData.sedeId] : []);
    
    const nuevaFormaPago = await prisma.formaPago.create({
        data: {
            nombre: formaPagoData.nombre,
            tipo: formaPagoData.tipo,
            descripcion: formaPagoData.descripcion,
            activa: formaPagoData.activa !== undefined ? formaPagoData.activa : true,
            requiereValidacion: formaPagoData.requiereValidacion || false,
            requiereFolio: formaPagoData.requiereFolio || false,
            comisionPorcentaje: formaPagoData.comisionPorcentaje || 0,
            diasLiquidacion: formaPagoData.diasLiquidacion || 0,
            bancoAsociado: formaPagoData.bancoAsociado || null,
            requiereComprobante: formaPagoData.requiereComprobante || false,
            permiteCambio: formaPagoData.permiteCambio !== undefined ? formaPagoData.permiteCambio : true,
            limiteMaximo: formaPagoData.limiteMaximo || null,
            limiteMinimo: formaPagoData.limiteMinimo || null,
            sedeId: sedesIds.length === 1 ? sedesIds[0] : null,
            usuarioCreacion: formaPagoData.usuarioCreacion || 'Sistema',
            usuarioModificacion: formaPagoData.usuarioModificacion || 'Sistema',
            sedes: sedesIds.length > 0 ? {
                create: sedesIds.map(sedeId => ({
                    sedeId: sedeId
                }))
            } : undefined
        },
        include: {
            sede: true,
            sedes: {
                include: {
                    sede: true
                }
            }
        }
    });

    return nuevaFormaPago;
};

exports.findFormaPagoById = async (id) => {
    return await prisma.formaPago.findUnique({
        where: { id },
        include: {
            sede: true,
            sedes: {
                include: {
                    sede: true
                }
            }
        }
    });
};

exports.getAllFormasPago = async (filtros = {}) => {
    const where = {};

    if (filtros.nombre) {
        where.nombre = {
            contains: filtros.nombre
        };
    }

    if (filtros.tipo) {
        where.tipo = filtros.tipo;
    }

    if (filtros.activa !== undefined && filtros.activa !== '') {
        where.activa = filtros.activa === 'activa' || filtros.activa === true;
    }

    return await prisma.formaPago.findMany({
        where,
        include: {
            sede: true,
            sedes: {
                include: {
                    sede: true
                }
            }
        },
        orderBy: { fechaCreacion: 'desc' }
    });
};

exports.updateFormaPago = async (id, updateData) => {
    // Verificar si el nombre ya existe en otra forma de pago
    if (updateData.nombre) {
        const existingFormaPago = await prisma.formaPago.findFirst({
            where: {
                nombre: updateData.nombre,
                id: { not: id }
            }
        });
        
        if (existingFormaPago) {
            const error = new Error('Ya existe una forma de pago con ese nombre.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    // Preparar datos de sedes
    const sedesIds = updateData.sedesIds || (updateData.sedeId ? [updateData.sedeId] : undefined);
    
    // Si se proporcionan sedesIds, actualizar las relaciones
    let dataToUpdate = { ...updateData };
    delete dataToUpdate.sedesIds;
    
    if (sedesIds !== undefined) {
        // Eliminar todas las relaciones existentes y crear las nuevas
        await prisma.formaPagoSede.deleteMany({
            where: { formaPagoId: id }
        });
        
        dataToUpdate.sedeId = sedesIds.length === 1 ? sedesIds[0] : null;
        dataToUpdate.sedes = sedesIds.length > 0 ? {
            create: sedesIds.map(sedeId => ({
                sedeId: sedeId
            }))
        } : undefined;
    } else if (updateData.sedeId !== undefined) {
        // Si solo se actualiza sedeId, mantener compatibilidad
        if (updateData.sedeId) {
            const sede = await prisma.sede.findUnique({
                where: { id: updateData.sedeId }
            });
            if (!sede) {
                const error = new Error('La sede especificada no existe.');
                error.status = 404;
                throw error;
            }
        }
    }

    return await prisma.formaPago.update({
        where: { id },
        data: {
            ...dataToUpdate,
            fechaModificacion: new Date()
        },
        include: {
            sede: true,
            sedes: {
                include: {
                    sede: true
                }
            }
        }
    });
};

exports.deleteFormaPago = async (id) => {
    return await prisma.formaPago.delete({
        where: { id }
    });
};

