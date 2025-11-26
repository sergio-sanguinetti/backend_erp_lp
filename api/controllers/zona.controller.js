const zonaService = require('../../services/zona.service');

// ========== CIUDADES ==========
// Obtener todas las ciudades
exports.getAllCiudades = async (req, res, next) => {
    try {
        const ciudades = await zonaService.getAllCiudades();
        res.status(200).json(ciudades);
    } catch (error) {
        next(error);
    }
};

// Obtener ciudad por ID
exports.getCiudadById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ciudad = await zonaService.findCiudadById(id);
        
        if (!ciudad) {
            return res.status(404).json({ message: 'Ciudad no encontrada.' });
        }

        res.status(200).json(ciudad);
    } catch (error) {
        next(error);
    }
};

// Crear nueva ciudad
exports.createCiudad = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear ciudades.' });
        }

        const ciudad = await zonaService.createCiudad(req.body);
        const ciudadData = { ...ciudad };

        res.status(201).json({
            message: 'Ciudad creada exitosamente.',
            ciudad: ciudadData
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar ciudad
exports.updateCiudad = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar ciudades.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const ciudad = await zonaService.updateCiudad(id, updateData);
        if (!ciudad) {
            return res.status(404).json({ message: 'Ciudad no encontrada.' });
        }

        const ciudadData = { ...ciudad };

        res.status(200).json({
            message: 'Ciudad actualizada exitosamente.',
            ciudad: ciudadData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar ciudad
exports.deleteCiudad = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar ciudades.' });
        }

        const { id } = req.params;
        const ciudad = await zonaService.deleteCiudad(id);
        
        if (!ciudad) {
            return res.status(404).json({ message: 'Ciudad no encontrada.' });
        }

        res.status(200).json({
            message: 'Ciudad eliminada exitosamente.',
            ciudad: {
                id: ciudad.id,
                nombre: ciudad.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== MUNICIPIOS ==========
// Obtener todos los municipios
exports.getAllMunicipios = async (req, res, next) => {
    try {
        const { ciudadId } = req.query;
        const municipios = await zonaService.getAllMunicipios(ciudadId);
        res.status(200).json(municipios);
    } catch (error) {
        next(error);
    }
};

// Obtener municipio por ID
exports.getMunicipioById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const municipio = await zonaService.findMunicipioById(id);
        
        if (!municipio) {
            return res.status(404).json({ message: 'Municipio no encontrado.' });
        }

        res.status(200).json(municipio);
    } catch (error) {
        next(error);
    }
};

// Crear nuevo municipio
exports.createMunicipio = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear municipios.' });
        }

        const municipio = await zonaService.createMunicipio(req.body);
        const municipioData = { ...municipio };

        res.status(201).json({
            message: 'Municipio creado exitosamente.',
            municipio: municipioData
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar municipio
exports.updateMunicipio = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar municipios.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const municipio = await zonaService.updateMunicipio(id, updateData);
        if (!municipio) {
            return res.status(404).json({ message: 'Municipio no encontrado.' });
        }

        const municipioData = { ...municipio };

        res.status(200).json({
            message: 'Municipio actualizado exitosamente.',
            municipio: municipioData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar municipio
exports.deleteMunicipio = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar municipios.' });
        }

        const { id } = req.params;
        const municipio = await zonaService.deleteMunicipio(id);
        
        if (!municipio) {
            return res.status(404).json({ message: 'Municipio no encontrado.' });
        }

        res.status(200).json({
            message: 'Municipio eliminado exitosamente.',
            municipio: {
                id: municipio.id,
                nombre: municipio.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== ZONAS ==========
// Obtener todas las zonas
exports.getAllZonas = async (req, res, next) => {
    try {
        const { municipioId, ciudadId } = req.query;
        const zonas = await zonaService.getAllZonas(municipioId, ciudadId);
        res.status(200).json(zonas);
    } catch (error) {
        next(error);
    }
};

// Obtener zona por ID
exports.getZonaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const zona = await zonaService.findZonaById(id);
        
        if (!zona) {
            return res.status(404).json({ message: 'Zona no encontrada.' });
        }

        res.status(200).json(zona);
    } catch (error) {
        next(error);
    }
};

// Crear nueva zona
exports.createZona = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear zonas.' });
        }

        const zona = await zonaService.createZona(req.body);
        const zonaData = { ...zona };

        res.status(201).json({
            message: 'Zona creada exitosamente.',
            zona: zonaData
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar zona
exports.updateZona = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden modificar zonas.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const zona = await zonaService.updateZona(id, updateData);
        if (!zona) {
            return res.status(404).json({ message: 'Zona no encontrada.' });
        }

        const zonaData = { ...zona };

        res.status(200).json({
            message: 'Zona actualizada exitosamente.',
            zona: zonaData
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar zona
exports.deleteZona = async (req, res, next) => {
    try {
        // Verificar que el usuario sea administrador
        if (req.user && req.user.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar zonas.' });
        }

        const { id } = req.params;
        const zona = await zonaService.deleteZona(id);
        
        if (!zona) {
            return res.status(404).json({ message: 'Zona no encontrada.' });
        }

        res.status(200).json({
            message: 'Zona eliminada exitosamente.',
            zona: {
                id: zona.id,
                nombre: zona.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};

