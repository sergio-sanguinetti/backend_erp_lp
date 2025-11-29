// services/ruta.service.js

const { prisma } = require('../config/database');

exports.createRuta = async (rutaData) => {
    // Verificar si el código ya existe
    const existingRuta = await prisma.ruta.findUnique({
        where: { codigo: rutaData.codigo }
    });
    
    if (existingRuta) {
        const error = new Error('Ya existe una ruta con ese código.');
        error.status = 409; // Conflict
        throw error;
    }

    // Verificar que los repartidores existen y tienen rol repartidor
    if (rutaData.repartidoresIds && rutaData.repartidoresIds.length > 0) {
        const repartidores = await prisma.usuario.findMany({
            where: {
                id: { in: rutaData.repartidoresIds },
                rol: 'repartidor'
            }
        });

        if (repartidores.length !== rutaData.repartidoresIds.length) {
            const error = new Error('Uno o más repartidores no existen o no tienen el rol correcto.');
            error.status = 400;
            throw error;
        }
    }

    // Si se proporciona zonaId, obtener el nombre de la zona
    let zonaNombre = rutaData.zona;
    if (rutaData.zonaId) {
        const zona = await prisma.zona.findUnique({
            where: { id: rutaData.zonaId },
            include: {
                municipio: {
                    include: {
                        ciudad: true
                    }
                }
            }
        });
        if (zona) {
            zonaNombre = zona.nombre;
        } else {
            const error = new Error('Zona no encontrada.');
            error.status = 404;
            throw error;
        }
    }

    // Crear la ruta con repartidores
    const nuevaRuta = await prisma.ruta.create({
        data: {
            nombre: rutaData.nombre,
            codigo: rutaData.codigo,
            descripcion: rutaData.descripcion || null,
            zona: zonaNombre,
            zonaId: rutaData.zonaId || null,
            sedeId: rutaData.sedeId || null,
            activa: rutaData.activa !== undefined ? rutaData.activa : true,
            horarioInicio: rutaData.horarioInicio || null,
            horarioFin: rutaData.horarioFin || null,
            usuarioCreacion: rutaData.usuarioCreacion || 'Sistema',
            usuarioModificacion: rutaData.usuarioModificacion || 'Sistema',
            repartidores: rutaData.repartidoresIds && rutaData.repartidoresIds.length > 0 ? {
                create: rutaData.repartidoresIds.map(usuarioId => ({
                    usuarioId: usuarioId
                }))
            } : undefined
        },
        include: {
            repartidores: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidoPaterno: true,
                            apellidoMaterno: true,
                            email: true,
                            telefono: true,
                            rol: true,
                            estado: true
                        }
                    }
                }
            },
            zonaRelacion: {
                include: {
                    municipio: {
                        include: {
                            ciudad: true
                        }
                    }
                }
            },
            sede: true
        }
    });

    return nuevaRuta;
};

exports.findRutaById = async (id) => {
    return await prisma.ruta.findUnique({
        where: { id },
        include: {
            repartidores: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidoPaterno: true,
                            apellidoMaterno: true,
                            email: true,
                            telefono: true,
                            rol: true,
                            estado: true
                        }
                    }
                }
            },
            zonaRelacion: {
                include: {
                    municipio: {
                        include: {
                            ciudad: true
                        }
                    }
                }
            },
            sede: true
        }
    });
};

exports.getAllRutas = async (filtros = {}) => {
    const where = {};

    if (filtros.nombre) {
        where.nombre = {
            contains: filtros.nombre
        };
    }

    if (filtros.zona) {
        where.zona = filtros.zona;
    }

    if (filtros.activa !== undefined && filtros.activa !== '') {
        // Aceptar 'true', 'activa', true, o '1' como valores para activa
        const activaValue = filtros.activa;
        if (activaValue === 'true' || activaValue === true || activaValue === 'activa' || activaValue === '1') {
            where.activa = true;
        } else if (activaValue === 'false' || activaValue === false || activaValue === 'inactiva' || activaValue === '0') {
            where.activa = false;
        }
    }

    if (filtros.sedeId) {
        where.sedeId = filtros.sedeId;
        console.log('Filtro por sedeId aplicado:', filtros.sedeId);
    }

    if (filtros.repartidor) {
        where.repartidores = {
            some: {
                usuario: {
                    OR: [
                        { nombres: { contains: filtros.repartidor } },
                        { apellidoPaterno: { contains: filtros.repartidor } },
                        { email: { contains: filtros.repartidor } }
                    ]
                }
            }
        };
    }

    console.log('Filtros recibidos en getAllRutas:', filtros);
    console.log('Where clause:', JSON.stringify(where, null, 2));

    const rutas = await prisma.ruta.findMany({
        where,
        include: {
            repartidores: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidoPaterno: true,
                            apellidoMaterno: true,
                            email: true,
                            telefono: true,
                            rol: true,
                            estado: true
                        }
                    }
                }
            },
            zonaRelacion: {
                include: {
                    municipio: {
                        include: {
                            ciudad: true
                        }
                    }
                }
            }
        },
        orderBy: { fechaCreacion: 'desc' }
    });

    console.log(`Rutas encontradas: ${rutas.length}`);
    if (rutas.length > 0) {
        console.log('Primeras rutas:', rutas.slice(0, 3).map(r => ({ id: r.id, nombre: r.nombre, sedeId: r.sedeId })));
    }

    // Si la relación sede no está disponible, cargarla manualmente
    if (rutas.length > 0 && !rutas[0].sede && rutas[0].sedeId) {
        for (const ruta of rutas) {
            if (ruta.sedeId) {
                try {
                    ruta.sede = await prisma.sede.findUnique({
                        where: { id: ruta.sedeId }
                    });
                } catch (e) {
                    console.warn(`No se pudo cargar la sede ${ruta.sedeId} para la ruta ${ruta.id}`);
                    ruta.sede = null;
                }
            }
        }
    }

    return rutas;
};

exports.updateRuta = async (id, updateData) => {
    // Verificar si el código ya existe en otra ruta
    if (updateData.codigo) {
        const existingRuta = await prisma.ruta.findFirst({
            where: {
                codigo: updateData.codigo,
                id: { not: id }
            }
        });
        
        if (existingRuta) {
            const error = new Error('Ya existe una ruta con ese código.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    // Verificar que los repartidores existen y tienen rol repartidor
    if (updateData.repartidoresIds !== undefined) {
        if (updateData.repartidoresIds.length > 0) {
            const repartidores = await prisma.usuario.findMany({
                where: {
                    id: { in: updateData.repartidoresIds },
                    rol: 'repartidor'
                }
            });

            if (repartidores.length !== updateData.repartidoresIds.length) {
                const error = new Error('Uno o más repartidores no existen o no tienen el rol correcto.');
                error.status = 400;
                throw error;
            }
        }

        // Eliminar relaciones existentes y crear nuevas
        await prisma.usuarioRuta.deleteMany({
            where: { rutaId: id }
        });
    }

    // Si se proporciona zonaId, obtener el nombre de la zona
    if (updateData.zonaId) {
        const zona = await prisma.zona.findUnique({
            where: { id: updateData.zonaId },
            include: {
                municipio: {
                    include: {
                        ciudad: true
                    }
                }
            }
        });
        if (zona) {
            updateData.zona = zona.nombre;
        } else {
            const error = new Error('Zona no encontrada.');
            error.status = 404;
            throw error;
        }
    }

    // Preparar datos para actualizar
    const dataToUpdate = { ...updateData };
    delete dataToUpdate.repartidoresIds;

    // Si hay repartidores, agregarlos
    if (updateData.repartidoresIds !== undefined) {
        dataToUpdate.repartidores = updateData.repartidoresIds.length > 0 ? {
            create: updateData.repartidoresIds.map(usuarioId => ({
                usuarioId: usuarioId
            }))
        } : undefined;
    }

    dataToUpdate.fechaModificacion = new Date();

    return await prisma.ruta.update({
        where: { id },
        data: dataToUpdate,
        include: {
            repartidores: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidoPaterno: true,
                            apellidoMaterno: true,
                            email: true,
                            telefono: true,
                            rol: true,
                            estado: true
                        }
                    }
                }
            },
            zonaRelacion: {
                include: {
                    municipio: {
                        include: {
                            ciudad: true
                        }
                    }
                }
            },
            sede: true
        }
    });
};

exports.deleteRuta = async (id) => {
    return await prisma.ruta.delete({
        where: { id }
    });
};

