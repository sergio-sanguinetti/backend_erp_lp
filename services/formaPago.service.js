// services/formaPago.service.js

const { prisma } = require('../config/database');

// Valores válidos del enum TipoFormaPago
const TIPOS_FORMAPAGO_VALIDOS = ['efectivo', 'terminal', 'transferencia', 'cheque', 'deposito', 'credito'];

// Función para validar y convertir el tipo
const validarTipoFormaPago = async (tipo) => {
    if (!tipo) {
        const error = new Error('El tipo de forma de pago es requerido.');
        error.status = 400;
        throw error;
    }

    // Si el tipo ya es un valor válido del enum, usarlo directamente
    if (TIPOS_FORMAPAGO_VALIDOS.includes(tipo.toLowerCase())) {
        return tipo.toLowerCase();
    }

    // Si es un código, buscar en TipoFormaPagoConfig
    try {
        const tipoFormaPago = await prisma.tipoFormaPagoConfig.findUnique({
            where: { codigo: tipo }
        });

        if (tipoFormaPago) {
            // Si el código del tipo coincide con un valor del enum, usarlo
            if (TIPOS_FORMAPAGO_VALIDOS.includes(tipoFormaPago.codigo.toLowerCase())) {
                return tipoFormaPago.codigo.toLowerCase();
            }
            // Si no coincide, usar el código directamente (aunque esto fallará con el enum actual)
            // Por ahora, lanzar error indicando que debe ser un valor válido del enum
            const error = new Error(`El código de tipo "${tipoFormaPago.codigo}" no coincide con ningún valor válido del enum. Los valores válidos son: ${TIPOS_FORMAPAGO_VALIDOS.join(', ')}`);
            error.status = 400;
            throw error;
        }
    } catch (error) {
        // Si la tabla no existe o hay otro error, continuar con la validación
        if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
            throw error;
        }
    }

    // Si no se encontró y no es un valor válido, lanzar error
    const error = new Error(`El tipo "${tipo}" no es válido. Los valores válidos son: ${TIPOS_FORMAPAGO_VALIDOS.join(', ')}`);
    error.status = 400;
    throw error;
};

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

    // Validar y convertir el tipo
    const tipoValidado = await validarTipoFormaPago(formaPagoData.tipo);

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

    // Validar que se seleccione al menos una sede
    const sedesIds = formaPagoData.sedesIds || (formaPagoData.sedeId ? [formaPagoData.sedeId] : []);
    if (sedesIds.length === 0) {
        const error = new Error('Debes seleccionar al menos una sede para crear la forma de pago.');
        error.status = 400;
        throw error;
    }

    // Verificar que todas las sedes existen
    for (const sedeId of sedesIds) {
        const sede = await prisma.sede.findUnique({
            where: { id: sedeId }
        });
        if (!sede) {
            const error = new Error(`La sede con ID ${sedeId} no existe.`);
            error.status = 404;
            throw error;
        }
    }
    
    const nuevaFormaPago = await prisma.formaPago.create({
        data: {
            nombre: formaPagoData.nombre,
            tipo: tipoValidado,
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

    // Validar y convertir el tipo si se proporciona
    if (updateData.tipo) {
        updateData.tipo = await validarTipoFormaPago(updateData.tipo);
    }

    // Preparar datos de sedes
    const sedesIds = updateData.sedesIds || (updateData.sedeId ? [updateData.sedeId] : undefined);
    
    // Si se proporcionan sedes, validar que todas existan
    if (sedesIds !== undefined && sedesIds.length > 0) {
        for (const sedeId of sedesIds) {
            const sede = await prisma.sede.findUnique({
                where: { id: sedeId }
            });
            if (!sede) {
                const error = new Error(`La sede con ID ${sedeId} no existe.`);
                error.status = 404;
                throw error;
            }
        }
    }
    
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

