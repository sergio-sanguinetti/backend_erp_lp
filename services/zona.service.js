// services/zona.service.js

const { prisma } = require('../config/database');

// ========== CIUDADES ==========
exports.createCiudad = async (ciudadData) => {
    // Verificar si el estado ya existe
    const existingCiudad = await prisma.ciudad.findFirst({
        where: { estado: ciudadData.estado }
    });
    
    if (existingCiudad) {
        const error = new Error('Ya existe una ciudad con ese estado.');
        error.status = 409; // Conflict
        throw error;
    }

    const nuevaCiudad = await prisma.ciudad.create({
        data: {
            nombre: ciudadData.nombre || null,
            codigo: ciudadData.codigo || null,
            estado: ciudadData.estado,
            activa: ciudadData.activa !== undefined ? ciudadData.activa : true,
        }
    });

    return nuevaCiudad;
};

exports.findCiudadById = async (id) => {
    return await prisma.ciudad.findUnique({
        where: { id },
        include: {
            municipios: {
                include: {
                    zonas: true
                }
            }
        }
    });
};

exports.getAllCiudades = async () => {
    return await prisma.ciudad.findMany({
        include: {
            municipios: {
                include: {
                    zonas: true
                }
            }
        },
        orderBy: { fechaCreacion: 'desc' }
    });
};

exports.updateCiudad = async (id, updateData) => {
    // Verificar si el estado ya existe en otra ciudad
    if (updateData.estado) {
        const existingCiudad = await prisma.ciudad.findFirst({
            where: {
                estado: updateData.estado,
                id: { not: id }
            }
        });
        
        if (existingCiudad) {
            const error = new Error('Ya existe una ciudad con ese estado.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    // Si se actualiza nombre o codigo y vienen vacíos, establecerlos como null
    if (updateData.nombre === '') updateData.nombre = null;
    if (updateData.codigo === '') updateData.codigo = null;

    return await prisma.ciudad.update({
        where: { id },
        data: updateData
    });
};

exports.deleteCiudad = async (id) => {
    // Verificar si hay municipios asociados
    const ciudad = await prisma.ciudad.findUnique({
        where: { id },
        include: {
            municipios: true
        }
    });

    if (!ciudad) {
        const error = new Error('Ciudad no encontrada.');
        error.status = 404;
        throw error;
    }

    if (ciudad.municipios && ciudad.municipios.length > 0) {
        const error = new Error('No se puede eliminar la ciudad porque tiene municipios asociados.');
        error.status = 400; // Bad Request
        throw error;
    }

    return await prisma.ciudad.delete({
        where: { id }
    });
};

// ========== MUNICIPIOS ==========
exports.createMunicipio = async (municipioData) => {
    // Verificar que la ciudad existe
    const ciudad = await prisma.ciudad.findUnique({
        where: { id: municipioData.ciudadId }
    });

    if (!ciudad) {
        const error = new Error('Ciudad no encontrada.');
        error.status = 404;
        throw error;
    }

    // Verificar si el nombre ya existe en la misma ciudad
    const existingMunicipio = await prisma.municipio.findFirst({
        where: { 
            nombre: municipioData.nombre,
            ciudadId: municipioData.ciudadId
        }
    });
    
    if (existingMunicipio) {
        const error = new Error('Ya existe un municipio con ese nombre en esta ciudad.');
        error.status = 409; // Conflict
        throw error;
    }

    const nuevoMunicipio = await prisma.municipio.create({
        data: {
            nombre: municipioData.nombre,
            codigo: municipioData.codigo,
            ciudadId: municipioData.ciudadId,
            activo: municipioData.activo !== undefined ? municipioData.activo : true,
        },
        include: {
            ciudad: true
        }
    });

    return nuevoMunicipio;
};

exports.findMunicipioById = async (id) => {
    return await prisma.municipio.findUnique({
        where: { id },
        include: {
            ciudad: true,
            zonas: true
        }
    });
};

exports.getAllMunicipios = async (ciudadId) => {
    const where = ciudadId ? { ciudadId } : {};
    
    return await prisma.municipio.findMany({
        where,
        include: {
            ciudad: true,
            zonas: true
        },
        orderBy: { fechaCreacion: 'desc' }
    });
};

exports.updateMunicipio = async (id, updateData) => {
    // Verificar si se está cambiando la ciudad
    if (updateData.ciudadId) {
        const ciudad = await prisma.ciudad.findUnique({
            where: { id: updateData.ciudadId }
        });

        if (!ciudad) {
            const error = new Error('Ciudad no encontrada.');
            error.status = 404;
            throw error;
        }
    }

    // Verificar si el nombre ya existe en la misma ciudad
    if (updateData.nombre) {
        const municipio = await prisma.municipio.findUnique({
            where: { id }
        });

        const ciudadId = updateData.ciudadId || municipio.ciudadId;
        
        const existingMunicipio = await prisma.municipio.findFirst({
            where: {
                nombre: updateData.nombre,
                ciudadId: ciudadId,
                id: { not: id }
            }
        });
        
        if (existingMunicipio) {
            const error = new Error('Ya existe un municipio con ese nombre en esta ciudad.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    return await prisma.municipio.update({
        where: { id },
        data: updateData,
        include: {
            ciudad: true
        }
    });
};

exports.deleteMunicipio = async (id) => {
    // Verificar si hay zonas asociadas
    const municipio = await prisma.municipio.findUnique({
        where: { id },
        include: {
            zonas: true
        }
    });

    if (!municipio) {
        const error = new Error('Municipio no encontrado.');
        error.status = 404;
        throw error;
    }

    if (municipio.zonas && municipio.zonas.length > 0) {
        const error = new Error('No se puede eliminar el municipio porque tiene zonas asociadas.');
        error.status = 400; // Bad Request
        throw error;
    }

    return await prisma.municipio.delete({
        where: { id }
    });
};

// ========== ZONAS ==========
exports.createZona = async (zonaData) => {
    // Verificar que el municipio existe
    const municipio = await prisma.municipio.findUnique({
        where: { id: zonaData.municipioId },
        include: {
            ciudad: true
        }
    });

    if (!municipio) {
        const error = new Error('Municipio no encontrado.');
        error.status = 404;
        throw error;
    }

    // Verificar si el nombre ya existe en el mismo municipio
    const existingZona = await prisma.zona.findFirst({
        where: { 
            nombre: zonaData.nombre,
            municipioId: zonaData.municipioId
        }
    });
    
    if (existingZona) {
        const error = new Error('Ya existe una zona con ese nombre en este municipio.');
        error.status = 409; // Conflict
        throw error;
    }

    const nuevaZona = await prisma.zona.create({
        data: {
            nombre: zonaData.nombre,
            codigo: zonaData.codigo,
            descripcion: zonaData.descripcion,
            municipioId: zonaData.municipioId,
            activa: zonaData.activa !== undefined ? zonaData.activa : true,
        },
        include: {
            municipio: {
                include: {
                    ciudad: true
                }
            }
        }
    });

    return nuevaZona;
};

exports.findZonaById = async (id) => {
    return await prisma.zona.findUnique({
        where: { id },
        include: {
            municipio: {
                include: {
                    ciudad: true
                }
            }
        }
    });
};

exports.getAllZonas = async (municipioId, ciudadId) => {
    const where = {};
    
    if (municipioId) {
        where.municipioId = municipioId;
    } else if (ciudadId) {
        // Si se proporciona ciudadId, buscar municipios de esa ciudad
        const municipios = await prisma.municipio.findMany({
            where: { ciudadId },
            select: { id: true }
        });
        where.municipioId = { in: municipios.map(m => m.id) };
    }
    
    return await prisma.zona.findMany({
        where,
        include: {
            municipio: {
                include: {
                    ciudad: true
                }
            }
        },
        orderBy: { fechaCreacion: 'desc' }
    });
};

exports.updateZona = async (id, updateData) => {
    // Verificar si se está cambiando el municipio
    if (updateData.municipioId) {
        const municipio = await prisma.municipio.findUnique({
            where: { id: updateData.municipioId }
        });

        if (!municipio) {
            const error = new Error('Municipio no encontrado.');
            error.status = 404;
            throw error;
        }
    }

    // Verificar si el nombre ya existe en el mismo municipio
    if (updateData.nombre) {
        const zona = await prisma.zona.findUnique({
            where: { id }
        });

        const municipioId = updateData.municipioId || zona.municipioId;
        
        const existingZona = await prisma.zona.findFirst({
            where: {
                nombre: updateData.nombre,
                municipioId: municipioId,
                id: { not: id }
            }
        });
        
        if (existingZona) {
            const error = new Error('Ya existe una zona con ese nombre en este municipio.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    return await prisma.zona.update({
        where: { id },
        data: updateData,
        include: {
            municipio: {
                include: {
                    ciudad: true
                }
            }
        }
    });
};

exports.deleteZona = async (id) => {
    const zona = await prisma.zona.findUnique({
        where: { id }
    });

    if (!zona) {
        const error = new Error('Zona no encontrada.');
        error.status = 404;
        throw error;
    }

    return await prisma.zona.delete({
        where: { id }
    });
};

