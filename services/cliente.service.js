// services/cliente.service.js

const { prisma } = require('../config/database');

// Función para generar código QR único
const generarCodigoQR = (clienteId, index) => {
  // Usar los últimos 3 caracteres del ID del cliente o un número
  const clienteHash = clienteId ? clienteId.substring(clienteId.length - 3) : '000'
  const sufijo = String.fromCharCode(65 + (index % 26)) // A-Z
  return `QR${clienteHash}${sufijo}`
}

exports.createCliente = async (clienteData) => {
    // Verificar si el email ya existe (solo si el email no está vacío)
    if (clienteData.email && clienteData.email.trim() !== '') {
        const existingCliente = await prisma.cliente.findUnique({
            where: { email: clienteData.email.toLowerCase() }
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
            email: (clienteData.email && clienteData.email.trim() !== '') ? clienteData.email.toLowerCase() : null,
            telefono: clienteData.telefono,
            telefonoSecundario: clienteData.telefonoSecundario || null,
            calle: clienteData.calle,
            numeroExterior: clienteData.numeroExterior,
            numeroInterior: clienteData.numeroInterior || null,
            colonia: clienteData.colonia,
            municipio: clienteData.municipio,
            estado: clienteData.estado,
            codigoPostal: clienteData.codigoPostal,
            rfc: clienteData.rfc || null,
            curp: clienteData.curp || null,
            rutaId: clienteData.rutaId || null,
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
                    activo: domicilio.activo !== undefined ? domicilio.activo : true,
                    codigoQR: codigoQR
                }
            })
        }
    }

    // Recargar el cliente con los domicilios
    return await prisma.cliente.findUnique({
        where: { id: nuevoCliente.id },
        include: {
            ruta: true,
            domicilios: true
        }
    });
};

exports.findClienteById = async (id) => {
    return await prisma.cliente.findUnique({
        where: { id },
        include: {
            ruta: true,
            domicilios: true
        }
    });
};

exports.getAllClientes = async (filtros = {}) => {
    const where = {};

    if (filtros.nombre) {
        where.OR = [
            { nombre: { contains: filtros.nombre } },
            { apellidoPaterno: { contains: filtros.nombre } },
            { apellidoMaterno: { contains: filtros.nombre } }
        ];
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

    return await prisma.cliente.findMany({
        where,
        include: {
            ruta: true,
            domicilios: {
                where: { activo: true }
            }
        },
        orderBy: { fechaRegistro: 'desc' }
    });
};

exports.updateCliente = async (id, updateData) => {
    // Verificar si el email ya existe en otro cliente (solo si el email no está vacío)
    if (updateData.email && updateData.email.trim() !== '') {
        const existingCliente = await prisma.cliente.findFirst({
            where: {
                email: updateData.email.toLowerCase(),
                id: { not: id }
            }
        });
        
        if (existingCliente) {
            const error = new Error('Ya existe un cliente con ese email.');
            error.status = 409; // Conflict
            throw error;
        }
        updateData.email = updateData.email.toLowerCase();
    } else if (updateData.email !== undefined) {
        // Si el email está vacío, establecerlo como null
        updateData.email = null;
    }

    // Actualizar el cliente
    const clienteActualizado = await prisma.cliente.update({
        where: { id },
        data: updateData,
        include: {
            ruta: true,
            domicilios: true
        }
    });

    return clienteActualizado;
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

