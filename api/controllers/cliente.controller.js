const clienteService = require('../../services/cliente.service');

// Obtener clientes por rutas con paginación y búsqueda (para app repartidores)
exports.getClientesByRutasPaginated = async (req, res, next) => {
    try {
        const rutaIdsParam = req.query.rutaIds;
        const limit = req.query.limit;
        const offset = req.query.offset;
        const q = req.query.q;

        const rutaIds = rutaIdsParam
            ? rutaIdsParam.split(',').map(id => id.trim()).filter(Boolean)
            : [];

        const result = await clienteService.getClientesByRutasPaginated(rutaIds, {
            limit,
            offset,
            q,
            updatedAfter: req.query.updatedAfter,
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Obtener todos los clientes
exports.getAllClientes = async (req, res, next) => {
    try {
        const filtros = {
            nombre: req.query.nombre,
            email: req.query.email,
            estadoCliente: req.query.estadoCliente,
            rutaId: req.query.rutaId,
            sedeId: req.query.sedeId
        };
        const clientes = await clienteService.getAllClientes(filtros);
        res.status(200).json(clientes);
    } catch (error) {
        next(error);
    }
};

// Obtener cliente por ID
exports.getClienteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cliente = await clienteService.findClienteById(id);

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.status(200).json(cliente);
    } catch (error) {
        next(error);
    }
};

// Crear nuevo cliente
exports.createCliente = async (req, res, next) => {
    try {
        const cliente = await clienteService.createCliente(req.body);
        const clienteData = { ...cliente };

        res.status(201).json({
            message: 'Cliente creado exitosamente.',
            cliente: clienteData
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar cliente
exports.updateCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const cliente = await clienteService.updateCliente(id, updateData);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        const clienteData = { ...cliente };

        res.status(200).json({
            message: 'Cliente actualizado exitosamente.',
            cliente: clienteData
        });
    } catch (error) {
        next(error);
    }
};

// Buscar por código QR (id de cliente = QR general; id de domicilio = QR del domicilio)
exports.buscarPorQR = async (req, res, next) => {
    try {
        const codigo = req.query.codigo;
        if (!codigo) {
            return res.status(400).json({ message: 'Se requiere el parámetro codigo.' });
        }
        const result = await clienteService.buscarPorQR(codigo);
        res.status(200).json(result);
    } catch (error) {
        if (error.status === 404) return res.status(404).json({ message: error.message });
        if (error.status === 400) return res.status(400).json({ message: error.message });
        next(error);
    }
};

// Eliminar cliente
exports.deleteCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cliente = await clienteService.deleteCliente(id);

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.status(200).json({
            message: 'Cliente eliminado exitosamente.',
            cliente: {
                id: cliente.id,
                nombre: `${cliente.nombre} ${cliente.apellidoPaterno}`
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== DOMICILIOS ==========
// Obtener domicilios de un cliente
exports.getDomiciliosByCliente = async (req, res, next) => {
    try {
        const { clienteId } = req.params;
        const domicilios = await clienteService.getDomiciliosByCliente(clienteId);
        res.status(200).json(domicilios);
    } catch (error) {
        next(error);
    }
};

// Crear nuevo domicilio
exports.createDomicilio = async (req, res, next) => {
    try {
        const { clienteId } = req.params;
        const domicilio = await clienteService.createDomicilio(clienteId, req.body);

        res.status(201).json({
            message: 'Domicilio creado exitosamente.',
            domicilio: domicilio
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar domicilio
exports.updateDomicilio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const domicilio = await clienteService.updateDomicilio(id, req.body);

        res.status(200).json({
            message: 'Domicilio actualizado exitosamente.',
            domicilio: domicilio
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar domicilio
exports.deleteDomicilio = async (req, res, next) => {
    try {
        const { id } = req.params;
        await clienteService.deleteDomicilio(id);

        res.status(200).json({
            message: 'Domicilio eliminado exitosamente.'
        });
    } catch (error) {
        next(error);
    }
};

// Subida masiva de clientes desde Excel/CSV
exports.importarClientesMasivo = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No se proporcionó ningún archivo.'
            });
        } const resultados = await clienteService.importarClientesMasivo(
            req.file.buffer,
            req.file.originalname
        );

        res.status(200).json({
            message: 'Importación completada.',
            resultados: {
                total: resultados.total,
                exitosos: resultados.exitosos.length,
                errores: resultados.errores.length,
                detalles: {
                    exitosos: resultados.exitosos,
                    errores: resultados.errores
                }
            }
        });
    } catch (error) {
        next(error);
    }
};