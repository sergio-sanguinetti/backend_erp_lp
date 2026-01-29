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

    // Crear domicilios si se proporcionan
    const domiciliosData = clienteData.domicilios || [];
    if (domiciliosData.length > 0) {
        for (let i = 0; i < domiciliosData.length; i++) {
            const domicilio = domiciliosData[i]
            const codigoQR = domicilio.codigoQR || generarCodigoQR(nuevoCliente.id, i.toString())
            
            await prisma.domicilio.create({
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
                    codigoQR: codigoQR
                }
            })
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

    // Generar código QR si no se proporciona
    const codigoQR = domicilioData.codigoQR || generarCodigoQR(clienteId, Date.now().toString());

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
            codigoQR: codigoQR
        }
    });

    return nuevoDomicilio;
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
