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

        // Restricción de sucursal
        if (req.user && req.user.rol !== 'superAdministrador' && req.user.sede) {
            const { prisma } = require('../../config/database');
            const sede = await prisma.sede.findFirst({
                where: { OR: [{ id: req.user.sede }, { nombre: req.user.sede }] }
            });
            if (sede) {
                filtros.sedeId = sede.id;
            } else {
                filtros.sedeId = req.user.sede;
            }
        }

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

// Obtener clientes duplicados
exports.getDuplicados = async (req, res, next) => {
    try {
        const duplicados = await clienteService.getDuplicados();
        res.status(200).json(duplicados);
    } catch (error) {
        next(error);
    }
};

// Unificar clientes
exports.unificarClientes = async (req, res, next) => {
    try {
        const { principalId, secundariosIds } = req.body;
        if (!principalId || !secundariosIds || secundariosIds.length === 0) {
            return res.status(400).json({ message: 'Se requiere cliente principal y al menos un cliente secundario.' });
        }
        const result = await clienteService.unificarClientes(principalId, secundariosIds);
        res.status(200).json({
            message: 'Clientes unificados exitosamente',
            result
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

// ========== ANÁLISIS DE CLIENTES ==========

// Ranking de clientes con KPIs
exports.getRanking = async (req, res, next) => {
    try {
        const { tipoServicio, fechaDesde, fechaHasta, sedeId: querySedeId } = req.query;
        const { prisma } = require('../../config/database');
        const { getMexicoCityDayBounds } = require('../../utils/timezoneMexico');

        // Determinar sedeId (por query o por usuario)
        let sedeId = querySedeId;
        if (!sedeId && req.user && req.user.rol !== 'superAdministrador' && req.user.sede) {
            const sede = await prisma.sede.findFirst({
                where: { OR: [{ id: req.user.sede }, { nombre: req.user.sede }] }
            });
            sedeId = sede ? sede.id : req.user.sede;
        }

        // Construir filtro de pedidos
        const where = { estado: 'entregado' };
        if (tipoServicio && tipoServicio !== 'todos') {
            where.tipoServicio = tipoServicio;
        }
        if (sedeId) where.sedeId = sedeId;
        if (fechaDesde || fechaHasta) {
            where.fechaPedido = {};
            if (fechaDesde) where.fechaPedido.gte = getMexicoCityDayBounds(fechaDesde).start;
            if (fechaHasta) where.fechaPedido.lte = getMexicoCityDayBounds(fechaHasta).end;
        }

        // Obtener todos los pedidos entregados con sus productos
        const pedidos = await prisma.pedido.findMany({
            where,
            select: {
                id: true,
                clienteId: true,
                ventaTotal: true,
                tipoServicio: true,
                calculoPipas: true,
                rutaId: true,
                productosPedido: {
                    select: {
                        cantidad: true,
                        producto: {
                            select: { nombre: true, cantidadKilos: true }
                        }
                    }
                },
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        apellidoPaterno: true,
                        apellidoMaterno: true
                    }
                },
                ruta: {
                    select: { nombre: true }
                },
                repartidor: {
                    select: { nombres: true }
                }
            }
        });

        // Agrupar por cliente
        const clienteMap = {};
        let totalVendidoGlobal = 0;
        let litrosTotalesGlobal = 0;

        for (const pedido of pedidos) {
            const cId = pedido.clienteId;
            if (!clienteMap[cId]) {
                const nombreCompleto = [pedido.cliente?.nombre, pedido.cliente?.apellidoPaterno, pedido.cliente?.apellidoMaterno]
                    .filter(Boolean).join(' ').trim();
                clienteMap[cId] = {
                    id: cId,
                    nombre: nombreCompleto || 'Sin nombre',
                    ruta: pedido.ruta?.nombre || '',
                    operador: pedido.repartidor?.nombres || '',
                    visitas: 0,
                    totalCompras: 0,
                    litros: 0,
                    cil10: 0,
                    cil20: 0,
                    cil30: 0
                };
            }

            const c = clienteMap[cId];
            c.visitas++;
            const venta = parseFloat(pedido.ventaTotal) || 0;
            c.totalCompras += venta;
            totalVendidoGlobal += venta;

            // Actualizar ruta con la más reciente
            if (pedido.ruta?.nombre) {
                c.ruta = pedido.ruta.nombre;
                if (pedido.repartidor?.nombres) {
                    c.ruta += ' ' + pedido.repartidor.nombres.split(' ')[0].toUpperCase();
                }
            }

            // Calcular litros de pipas
            if (pedido.tipoServicio === 'pipas' && pedido.calculoPipas) {
                try {
                    const calc = typeof pedido.calculoPipas === 'string' ? JSON.parse(pedido.calculoPipas) : pedido.calculoPipas;
                    let litrosPedido = 0;
                    if (Array.isArray(calc)) {
                        litrosPedido = calc.reduce((s, carga) => s + (parseFloat(carga.cantidadLitros) || 0), 0);
                    } else if (calc && calc.cantidadLitros) {
                        litrosPedido = parseFloat(calc.cantidadLitros) || 0;
                    }
                    c.litros += litrosPedido;
                    litrosTotalesGlobal += litrosPedido;
                } catch (e) { /* ignore parse errors */ }
            }

            // Contar cilindros por tamaño
            if (pedido.tipoServicio === 'cilindros' && pedido.productosPedido) {
                for (const pp of pedido.productosPedido) {
                    const kilos = pp.producto?.cantidadKilos || 0;
                    const nombre = (pp.producto?.nombre || '').toLowerCase();
                    const cant = pp.cantidad || 0;
                    if (kilos === 10 || nombre.includes('10')) c.cil10 += cant;
                    else if (kilos === 20 || nombre.includes('20')) c.cil20 += cant;
                    else if (kilos === 30 || nombre.includes('30')) c.cil30 += cant;
                }
            }
        }

        // Convertir a array y ordenar por total descendente
        const ranking = Object.values(clienteMap)
            .sort((a, b) => b.totalCompras - a.totalCompras)
            .slice(0, 10);

        // KPIs
        const clientesArray = Object.values(clienteMap);
        const clientesActivos = clientesArray.length;
        const totalPedidos = pedidos.length;
        const ticketPromedio = totalPedidos > 0 ? Math.round(totalVendidoGlobal / totalPedidos) : 0;
        const frecuentes = clientesArray.filter(c => c.visitas >= 2).length;

        res.status(200).json({
            ranking,
            kpis: {
                clientesActivos,
                ticketPromedio,
                frecuentes,
                litrosTotales: Math.round(litrosTotalesGlobal * 10) / 10,
                totalVendido: Math.round(totalVendidoGlobal * 100) / 100
            }
        });
    } catch (error) {
        console.error('Error getRanking:', error);
        next(error);
    }
};

// Historial de un cliente específico
exports.getHistorialCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { prisma } = require('../../config/database');

        const cliente = await prisma.cliente.findUnique({
            where: { id },
            select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true }
        });

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        const pedidos = await prisma.pedido.findMany({
            where: { clienteId: id, estado: 'entregado' },
            orderBy: { fechaPedido: 'desc' },
            take: 50,
            select: {
                id: true,
                numeroPedido: true,
                fechaPedido: true,
                horaPedido: true,
                ventaTotal: true,
                tipoServicio: true,
                calculoPipas: true,
                ruta: { select: { nombre: true } },
                repartidor: { select: { nombres: true, apellidoPaterno: true } },
                productosPedido: {
                    select: {
                        cantidad: true,
                        producto: { select: { nombre: true, cantidadKilos: true } }
                    }
                }
            }
        });

        const totalHistorico = pedidos.reduce((s, p) => s + (parseFloat(p.ventaTotal) || 0), 0);
        const ticketPromedio = pedidos.length > 0 ? Math.round(totalHistorico / pedidos.length) : 0;

        let frecuenciaDias = null;
        if (pedidos.length >= 2) {
            const fechas = pedidos.map(p => new Date(p.fechaPedido)).sort((a, b) => a - b);
            let totalDias = 0;
            for (let i = 1; i < fechas.length; i++) totalDias += (fechas[i] - fechas[i - 1]) / 86400000;
            frecuenciaDias = (totalDias / (fechas.length - 1)).toFixed(1);
        }

        res.json({ totalHistorico, ticketPromedio, frecuenciaDias, totalVisitas: pedidos.length, pedidos });
    } catch (error) {
        console.error('Error getHistorialCliente:', error);
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

