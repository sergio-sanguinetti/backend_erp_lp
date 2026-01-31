// services/cliente.service.js

const { prisma } = require('../config/database');

// Tabla de mapeo de rutas Excel a códigos del sistema
const MAPEO_RUTAS = {
  'RUTA P 1DH': 'R1PDH',
  'RUTA P 1SMA': 'R1PSMA',
  'RUTA P 2DH': 'R2PDH',
  'RUTA P 2SMA': 'R2PSMA',
  'RUTA P 3DH': 'R3PDH',
  'R C 1DH': 'R1CDH',
  'R C 1SMA': 'R1CSMA',
  'R C 2DH': 'R2CDH',
  'R C 3SMA': 'R3CSMA'
};

// Función para generar código QR único
const generarCodigoQR = (clienteId, index) => {
  // Usar los últimos 3 caracteres del ID del cliente o un número
  const clienteHash = clienteId ? clienteId.substring(clienteId.length - 3) : '000'
  const sufijo = String.fromCharCode(65 + (index % 26)) // A-Z
  return `QR${clienteHash}${sufijo}`
}

exports.createCliente = async (clienteData) => {
    // Normalizar email: convertir strings vacíos, undefined, o null a null
    const emailNormalizado = clienteData.email && typeof clienteData.email === 'string' && clienteData.email.trim() !== ''
        ? clienteData.email.trim().toLowerCase()
        : null;

    // Verificar si el email ya existe (solo si el email no está vacío/null)
    if (emailNormalizado) {
        const existingCliente = await prisma.cliente.findUnique({
            where: { email: emailNormalizado }
        });
        
        if (existingCliente) {
            const error = new Error('Ya existe un cliente con ese email.');
            error.status = 409; // Conflict
            throw error;
        }
    }

    // Crear el cliente primero sin domicilios
    const nuevoCliente = await prisma.cliente.create({
        data: {
            nombre: clienteData.nombre,
            apellidoPaterno: clienteData.apellidoPaterno,
            apellidoMaterno: clienteData.apellidoMaterno,
            email: emailNormalizado, // null si está vacío o no se proporciona
            telefono: clienteData.telefono || '',
            telefonoSecundario: (clienteData.telefonoSecundario && clienteData.telefonoSecundario.trim() !== '') ? clienteData.telefonoSecundario : null,
            calle: clienteData.calle,
            numeroExterior: clienteData.numeroExterior,
            numeroInterior: (clienteData.numeroInterior && clienteData.numeroInterior.trim() !== '') ? clienteData.numeroInterior : null,
            colonia: clienteData.colonia || '',
            municipio: clienteData.municipio || '',
            estado: clienteData.estado || '',
            codigoPostal: clienteData.codigoPostal || '',
            rfc: (clienteData.rfc && clienteData.rfc.trim() !== '') ? clienteData.rfc : null,
            curp: (clienteData.curp && clienteData.curp.trim() !== '') ? clienteData.curp : null,
            rutaId: clienteData.rutaId || null,
            zonaId: clienteData.zonaId || null,
            limiteCredito: clienteData.limiteCredito || 0,
            saldoActual: clienteData.saldoActual || 0,
            pagosEspecialesAutorizados: clienteData.pagosEspecialesAutorizados || false,
            estadoCliente: clienteData.estadoCliente || 'activo'
        }
    });

    // Crear domicilios si se proporcionan (cada uno con QR = su id)
    const domiciliosData = clienteData.domicilios || [];
    if (domiciliosData.length > 0) {
        for (let i = 0; i < domiciliosData.length; i++) {
            const domicilio = domiciliosData[i]
            const tempCodigoQR = `temp-${nuevoCliente.id}-${i}-${Date.now()}`
            const creado = await prisma.domicilio.create({
                data: {
                    clienteId: nuevoCliente.id,
                    tipo: domicilio.tipo,
                    calle: domicilio.calle,
                    numeroExterior: domicilio.numeroExterior,
                    numeroInterior: domicilio.numeroInterior || null,
                    colonia: domicilio.colonia,
                    municipio: domicilio.municipio,
                    estado: domicilio.estado,
                    codigoPostal: domicilio.codigoPostal,
                    referencia: domicilio.referencia || null,
                    latitud: domicilio.latitud !== undefined ? domicilio.latitud : null,
                    longitud: domicilio.longitud !== undefined ? domicilio.longitud : null,
                    activo: domicilio.activo !== undefined ? domicilio.activo : true,
                    codigoQR: tempCodigoQR
                }
            });
            await prisma.domicilio.update({
                where: { id: creado.id },
                data: { codigoQR: creado.id }
            });
        }
    }

    // Recargar el cliente con los domicilios
    const clienteCompleto = await prisma.cliente.findUnique({
        where: { id: nuevoCliente.id },
        include: {
            ruta: true,
            zona: true,
            domicilios: true
        }
    });

    // Normalizar email null a string vacío para compatibilidad con el frontend
    if (clienteCompleto) {
        return {
            ...clienteCompleto,
            email: clienteCompleto.email ?? ''
        };
    }

    return clienteCompleto;
};

exports.findClienteById = async (id) => {
    const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: {
            ruta: true,
            zona: true,
            domicilios: true
        }
    });

    // Normalizar email null a string vacío para compatibilidad con el frontend
    if (cliente) {
        return {
            ...cliente,
            email: cliente.email ?? ''
        };
    }

    return cliente;
};

exports.getAllClientes = async (filtros = {}) => {
    const where = {};
    const andConditions = [];

    if (filtros.nombre) {
        andConditions.push({
            OR: [
                { nombre: { contains: filtros.nombre } },
                { apellidoPaterno: { contains: filtros.nombre } },
                { apellidoMaterno: { contains: filtros.nombre } }
            ]
        });
    }

    if (filtros.email) {
        where.email = { contains: filtros.email };
    }

    if (filtros.estadoCliente) {
        where.estadoCliente = filtros.estadoCliente;
    }

    if (filtros.rutaId) {
        where.rutaId = filtros.rutaId;
    }

    // Filtrar por sede: buscar clientes cuyas rutas pertenezcan a la sede
    // También incluir clientes sin ruta asignada
    if (filtros.sedeId) {
        // Buscar todas las rutas de la sede
        const rutasDeSede = await prisma.ruta.findMany({
            where: { sedeId: filtros.sedeId },
            select: { id: true }
        });
        
        const rutasIds = rutasDeSede.map(r => r.id);
        
        if (rutasIds.length > 0) {
            // Incluir clientes con rutas de la sede O clientes sin ruta asignada
            andConditions.push({
                OR: [
                    { rutaId: { in: rutasIds } },
                    { rutaId: null }
                ]
            });
        } else {
            // Si no hay rutas para esta sede, mostrar solo clientes sin ruta
            andConditions.push({ rutaId: null });
        }
    }

    // Combinar todas las condiciones AND
    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    // Manejar el caso donde email puede ser null en la BD pero el schema espera String
    try {
        const clientes = await prisma.cliente.findMany({
            where,
            include: {
                ruta: {
                    include: {
                        sede: true
                    }
                },
                zona: true,
                domicilios: {
                    where: { activo: true }
                }
            },
            orderBy: { fechaRegistro: 'desc' }
        });
        
        // Normalizar emails null a string vacío si es necesario (para compatibilidad)
        return clientes.map(cliente => ({
            ...cliente,
            email: cliente.email ?? ''
        }));
    } catch (error) {
        // Si el error es por email null, el schema necesita ser actualizado
        if (error.message && error.message.includes('email') && error.message.includes('null')) {
            console.error('Error: El campo email tiene valores null en la BD pero el schema espera String no nullable.');
            console.error('Solución: Actualiza los registros en la BD o cambia el schema para permitir email nullable (String?)');
            throw new Error('Error de compatibilidad: El campo email tiene valores null. Por favor, actualiza la base de datos o regenera el cliente de Prisma.');
        }
        throw error;
    }
};

/**
 * Obtiene clientes con paginación (mismo filtrado que getAllClientes).
 * @param {object} filtros - nombre, email, estadoCliente, rutaId, sedeId
 * @param {number} page - página (1-based)
 * @param {number} pageSize - tamaño de página
 * @returns {{ data: object[], total: number }}
 */
exports.getClientesPaginados = async (filtros = {}, page = 1, pageSize = 10) => {
    const where = {};
    const andConditions = [];

    if (filtros.nombre) {
        andConditions.push({
            OR: [
                { nombre: { contains: filtros.nombre } },
                { apellidoPaterno: { contains: filtros.nombre } },
                { apellidoMaterno: { contains: filtros.nombre } }
            ]
        });
    }

    if (filtros.email) {
        where.email = { contains: filtros.email };
    }

    if (filtros.estadoCliente) {
        where.estadoCliente = filtros.estadoCliente;
    }

    if (filtros.rutaId) {
        where.rutaId = filtros.rutaId;
    }

    if (filtros.sedeId) {
        const rutasDeSede = await prisma.ruta.findMany({
            where: { sedeId: filtros.sedeId },
            select: { id: true }
        });
        const rutasIds = rutasDeSede.map(r => r.id);
        if (rutasIds.length > 0) {
            andConditions.push({
                OR: [
                    { rutaId: { in: rutasIds } },
                    { rutaId: null }
                ]
            });
        } else {
            andConditions.push({ rutaId: null });
        }
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    const skip = Math.max(0, (Number(page) || 1) - 1) * Math.max(1, Number(pageSize) || 10);
    const take = Math.max(1, Math.min(100, Number(pageSize) || 10));

    const [total, clientes] = await Promise.all([
        prisma.cliente.count({ where }),
        prisma.cliente.findMany({
            where,
            skip,
            take,
            include: {
                ruta: { include: { sede: true } },
                zona: true,
                domicilios: { where: { activo: true } }
            },
            orderBy: { fechaRegistro: 'desc' }
        })
    ]);

    return {
        data: clientes.map(cliente => ({
            ...cliente,
            email: cliente.email ?? ''
        })),
        total
    };
};

exports.updateCliente = async (id, updateData) => {
    // Normalizar email: convertir strings vacíos, undefined, o null a null
    if (updateData.email !== undefined) {
        const emailNormalizado = updateData.email && typeof updateData.email === 'string' && updateData.email.trim() !== ''
            ? updateData.email.trim().toLowerCase()
            : null;

        // Verificar si el email ya existe en otro cliente (solo si el email no está vacío/null)
        if (emailNormalizado) {
            const existingCliente = await prisma.cliente.findFirst({
                where: {
                    email: emailNormalizado,
                    id: { not: id }
                }
            });
            
            if (existingCliente) {
                const error = new Error('Ya existe un cliente con ese email.');
                error.status = 409; // Conflict
                throw error;
            }
        }
        
        // Actualizar el email normalizado
        updateData.email = emailNormalizado;
    }

    // Normalizar otros campos opcionales que pueden venir como strings vacíos
    if (updateData.telefonoSecundario !== undefined) {
        updateData.telefonoSecundario = (updateData.telefonoSecundario && updateData.telefonoSecundario.trim() !== '') 
            ? updateData.telefonoSecundario 
            : null;
    }
    
    if (updateData.numeroInterior !== undefined) {
        updateData.numeroInterior = (updateData.numeroInterior && updateData.numeroInterior.trim() !== '') 
            ? updateData.numeroInterior 
            : null;
    }
    
    if (updateData.rfc !== undefined) {
        updateData.rfc = (updateData.rfc && updateData.rfc.trim() !== '') 
            ? updateData.rfc 
            : null;
    }
    
    if (updateData.curp !== undefined) {
        updateData.curp = (updateData.curp && updateData.curp.trim() !== '') 
            ? updateData.curp 
            : null;
    }
    
    // Normalizar rutaId: convertir strings vacíos, undefined, o null a null
    if (updateData.rutaId !== undefined) {
        updateData.rutaId = (updateData.rutaId && typeof updateData.rutaId === 'string' && updateData.rutaId.trim() !== '') 
            ? updateData.rutaId.trim() 
            : null;
    }
    
    // Normalizar zonaId: convertir strings vacíos, undefined, o null a null
    if (updateData.zonaId !== undefined) {
        updateData.zonaId = (updateData.zonaId && typeof updateData.zonaId === 'string' && updateData.zonaId.trim() !== '') 
            ? updateData.zonaId.trim() 
            : null;
    }

    // Actualizar el cliente
    const clienteActualizado = await prisma.cliente.update({
        where: { id },
        data: updateData,
        include: {
            ruta: true,
            zona: true,
            domicilios: true
        }
    });

    // Normalizar email null a string vacío para compatibilidad con el frontend
    return {
        ...clienteActualizado,
        email: clienteActualizado.email ?? ''
    };
};

exports.deleteCliente = async (id) => {
    const cliente = await prisma.cliente.findUnique({
        where: { id }
    });

    if (!cliente) {
        const error = new Error('Cliente no encontrado.');
        error.status = 404;
        throw error;
    }

    return await prisma.cliente.delete({
        where: { id }
    });
};

// Función para obtener el código del sistema a partir de la ruta Excel
const obtenerCodigoRuta = (rutaExcel) => {
    // Limpiar espacios y convertir a mayúsculas
    const rutaLimpia = rutaExcel.trim().toUpperCase();
    return MAPEO_RUTAS[rutaLimpia] || null;
};

// Función para buscar ruta por código
const buscarRutaPorCodigo = async (codigo) => {
    const ruta = await prisma.ruta.findUnique({
        where: { codigo },
        select: {
            id: true,
            zonaId: true,
            codigo: true,
            nombre: true
        }
    });
    return ruta;
};

// Función para dividir el nombre completo en partes
const dividirNombre = (nombreCompleto) => {
    if (!nombreCompleto || typeof nombreCompleto !== 'string') {
        return {
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: ''
        };
    }

    const partes = nombreCompleto.trim().split(/\s+/);
    
    if (partes.length === 0) {
        return {
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: ''
        };
    }

    if (partes.length === 1) {
        return {
            nombre: partes[0],
            apellidoPaterno: '',
            apellidoMaterno: ''
        };
    }

    if (partes.length === 2) {
        return {
            nombre: partes[0],
            apellidoPaterno: partes[1],
            apellidoMaterno: ''
        };
    }

    // Si hay 3 o más partes, tomar la primera como nombre y las demás como apellidos
    return {
        nombre: partes[0],
        apellidoPaterno: partes.slice(1, -1).join(' ') || partes[1] || '',
        apellidoMaterno: partes[partes.length - 1] || ''
    };
};

// Subida masiva de clientes desde Excel/CSV
exports.importarClientesMasivo = async (archivoBuffer, nombreArchivo) => {
    const XLSX = require('xlsx');
    const resultados = {
        exitosos: [],
        errores: [],
        total: 0
    };

    try {
        // Leer el archivo Excel
        const workbook = XLSX.read(archivoBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const datos = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null,
            raw: false
        });

        if (datos.length < 2) {
            throw new Error('El archivo debe contener al menos una fila de datos además del encabezado.');
        }

        // Obtener el encabezado (primera fila)
        const encabezados = datos[0].map(h => h ? h.toString().trim().toUpperCase() : '');
        
        // Buscar índices de las columnas necesarias
        const indiceCliente = encabezados.findIndex(h => 
            h.includes('CLIENTE') || h === 'CLIENTE'
        );
        const indiceRuta = encabezados.findIndex(h => 
            h.includes('RUTA_PRINCIPAL') || h.includes('RUTA PRINCIPAL') || h === 'RUTA_PRINCIPAL'
        );

        if (indiceCliente === -1) {
            throw new Error('No se encontró la columna CLIENTE en el archivo.');
        }

        if (indiceRuta === -1) {
            throw new Error('No se encontró la columna RUTA_PRINCIPAL en el archivo.');
        }

        // Procesar cada fila (empezando desde la fila 2, índice 1)
        for (let i = 1; i < datos.length; i++) {
            const fila = datos[i];
            resultados.total++;

            try {
                const nombreCliente = fila[indiceCliente] ? fila[indiceCliente].toString().trim() : '';
                const rutaPrincipal = fila[indiceRuta] ? fila[indiceRuta].toString().trim() : '';

                if (!nombreCliente) {
                    resultados.errores.push({
                        fila: i + 1,
                        error: 'El nombre del cliente está vacío',
                        datos: { nombreCliente, rutaPrincipal }
                    });
                    continue;
                }

                if (!rutaPrincipal) {
                    resultados.errores.push({
                        fila: i + 1,
                        error: 'La ruta principal está vacía',
                        datos: { nombreCliente, rutaPrincipal }
                    });
                    continue;
                }

                // Obtener el código de la ruta del sistema
                const codigoRuta = obtenerCodigoRuta(rutaPrincipal);
                
                if (!codigoRuta) {
                    resultados.errores.push({
                        fila: i + 1,
                        error: `No se encontró el código de ruta para "${rutaPrincipal}"`,
                        datos: { nombreCliente, rutaPrincipal }
                    });
                    continue;
                }

                // Buscar la ruta en la base de datos
                const ruta = await buscarRutaPorCodigo(codigoRuta);
                
                if (!ruta) {
                    resultados.errores.push({
                        fila: i + 1,
                        error: `No se encontró la ruta con código "${codigoRuta}" en el sistema`,
                        datos: { nombreCliente, rutaPrincipal, codigoRuta }
                    });
                    continue;
                }

                // Dividir el nombre completo
                const { nombre, apellidoPaterno, apellidoMaterno } = dividirNombre(nombreCliente);

                // Crear el cliente con datos mínimos requeridos
                const clienteData = {
                    nombre: nombre || 'Sin nombre',
                    apellidoPaterno: apellidoPaterno || '',
                    apellidoMaterno: apellidoMaterno || '',
                    email: null, // No se proporciona en el archivo
                    telefono: '', // Valor por defecto
                    calle: 'Por definir', // Valor por defecto
                    numeroExterior: 'S/N', // Valor por defecto
                    colonia: 'Por definir',
                    municipio: 'Por definir',
                    estado: 'Por definir',
                    codigoPostal: '00000',
                    rutaId: ruta.id,
                    zonaId: ruta.zonaId,
                    limiteCredito: 0,
                    saldoActual: 0,
                    pagosEspecialesAutorizados: false,
                    estadoCliente: 'activo'
                };

                // Crear el cliente
                const nuevoCliente = await this.createCliente(clienteData);

                resultados.exitosos.push({
                    fila: i + 1,
                    cliente: {
                        id: nuevoCliente.id,
                        nombre: `${nuevoCliente.nombre} ${nuevoCliente.apellidoPaterno} ${nuevoCliente.apellidoMaterno}`.trim(),
                        ruta: ruta.nombre,
                        codigoRuta: codigoRuta
                    }
                });

            } catch (error) {
                resultados.errores.push({
                    fila: i + 1,
                    error: error.message || 'Error desconocido al procesar la fila',
                    datos: {
                        nombreCliente: fila[indiceCliente]?.toString() || '',
                        rutaPrincipal: fila[indiceRuta]?.toString() || ''
                    }
                });
            }
        }

        return resultados;

    } catch (error) {
        throw new Error(`Error al procesar el archivo: ${error.message}`);
    }
};

/**
 * Buscar por código QR: acepta id de cliente (QR general) o id de domicilio (QR del domicilio).
 * - Si el código es id de domicilio: devuelve { tipo: 'domicilio', cliente, domicilio }
 * - Si el código es id de cliente: devuelve { tipo: 'cliente', cliente, domicilios }
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.buscarPorQR = async (codigo) => {
    if (!codigo || typeof codigo !== 'string') {
        const error = new Error('Código QR no válido.');
        error.status = 400;
        throw error;
    }
    const codigoTrim = codigo.trim();
    let idBuscar = codigoTrim;
    try {
        const parsed = JSON.parse(codigoTrim);
        if (parsed.domicilioId) idBuscar = parsed.domicilioId;
        else if (parsed.clienteId) idBuscar = parsed.clienteId;
        else if (parsed.id) idBuscar = parsed.id;
    } catch (_) {}
    if (!UUID_REGEX.test(idBuscar)) {
        const error = new Error('Código QR no reconocido.');
        error.status = 404;
        throw error;
    }
    const domicilio = await prisma.domicilio.findUnique({
        where: { id: idBuscar },
        include: {
            cliente: {
                include: {
                    ruta: true,
                    zona: true,
                    domicilios: { where: { activo: true } }
                }
            }
        }
    });
    if (domicilio) {
        const cliente = { ...domicilio.cliente, email: domicilio.cliente.email ?? '' };
        return { tipo: 'domicilio', cliente, domicilio };
    }
    const cliente = await prisma.cliente.findUnique({
        where: { id: idBuscar },
        include: {
            ruta: true,
            zona: true,
            domicilios: { where: { activo: true } }
        }
    });
    if (cliente) {
        return {
            tipo: 'cliente',
            cliente: { ...cliente, email: cliente.email ?? '' },
            domicilios: cliente.domicilios || []
        };
    }
    const error = new Error('No se encontró cliente ni domicilio con este código QR.');
    error.status = 404;
    throw error;
};

// ========== DOMICILIOS ==========
exports.createDomicilio = async (clienteId, domicilioData) => {
    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
    });

    if (!cliente) {
        const error = new Error('Cliente no encontrado.');
        error.status = 404;
        throw error;
    }

    const tempCodigoQR = domicilioData.codigoQR || `temp-${clienteId}-${Date.now()}`;
    const nuevoDomicilio = await prisma.domicilio.create({
        data: {
            clienteId: clienteId,
            tipo: domicilioData.tipo,
            calle: domicilioData.calle,
            numeroExterior: domicilioData.numeroExterior,
            numeroInterior: domicilioData.numeroInterior || null,
            colonia: domicilioData.colonia,
            municipio: domicilioData.municipio,
            estado: domicilioData.estado,
            codigoPostal: domicilioData.codigoPostal,
            referencia: domicilioData.referencia || null,
            latitud: domicilioData.latitud !== undefined ? domicilioData.latitud : null,
            longitud: domicilioData.longitud !== undefined ? domicilioData.longitud : null,
            activo: domicilioData.activo !== undefined ? domicilioData.activo : true,
            codigoQR: tempCodigoQR
        }
    });

    // QR del domicilio = id del domicilio (único por domicilio)
    await prisma.domicilio.update({
        where: { id: nuevoDomicilio.id },
        data: { codigoQR: nuevoDomicilio.id }
    });

    return prisma.domicilio.findUnique({
        where: { id: nuevoDomicilio.id }
    });
};

exports.updateDomicilio = async (id, updateData) => {
    return await prisma.domicilio.update({
        where: { id },
        data: updateData
    });
};

exports.deleteDomicilio = async (id) => {
    return await prisma.domicilio.delete({
        where: { id }
    });
};

exports.getDomiciliosByCliente = async (clienteId) => {
    return await prisma.domicilio.findMany({
        where: { clienteId },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Obtener clientes por rutas con paginación y búsqueda en BD.
 * @param {string[]} rutaIds - IDs de rutas del repartidor
 * @param {Object} opts - { limit, offset, q }
 * @returns {Promise<{ total: number, clientes: Object[] }>}
 */
exports.getClientesByRutasPaginated = async (rutaIds, opts = {}) => {
    const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 10, 1), 100);
    const offset = Math.max(parseInt(opts.offset, 10) || 0, 0);
    const q = (opts.q && typeof opts.q === 'string') ? opts.q.trim() : '';

    if (!rutaIds || !Array.isArray(rutaIds) || rutaIds.length === 0) {
        return { total: 0, clientes: [] };
    }

    const where = {
        rutaId: { in: rutaIds },
    };

    if (q.length > 0) {
        where.OR = [
            { nombre: { contains: q } },
            { apellidoPaterno: { contains: q } },
            { apellidoMaterno: { contains: q } },
            { telefono: { contains: q } },
            { calle: { contains: q } },
            { colonia: { contains: q } },
            { municipio: { contains: q } },
            { domicilios: { some: { calle: { contains: q } } } },
            { domicilios: { some: { colonia: { contains: q } } } },
        ];
    }

    const include = {
        ruta: { include: { sede: true } },
        zona: true,
        domicilios: { where: { activo: true } },
    };

    const [total, clientes] = await Promise.all([
        prisma.cliente.count({ where }),
        prisma.cliente.findMany({
            where,
            include,
            orderBy: { fechaRegistro: 'desc' },
            take: limit,
            skip: offset,
        }),
    ]);

    const clientesNormalizados = clientes.map(cliente => ({
        ...cliente,
        email: cliente.email ?? '',
    }));

    return { total, clientes: clientesNormalizados };
};
