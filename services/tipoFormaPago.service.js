const { prisma } = require('../config/database')

// Obtener todos los tipos de formas de pago
exports.getAllTiposFormaPago = async (filtros = {}) => {
  // Validar que el modelo esté disponible
  if (!prisma.tipoFormaPagoConfig) {
    console.warn('Modelo TipoFormaPagoConfig no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate')
    return []
  }

  const where = {}

  if (filtros.activo !== undefined) {
    where.activo = filtros.activo === 'true' || filtros.activo === true
  }

  if (filtros.codigo) {
    where.codigo = { contains: filtros.codigo, mode: 'insensitive' }
  }

  if (filtros.nombre) {
    where.nombre = { contains: filtros.nombre, mode: 'insensitive' }
  }

  try {
    return await prisma.tipoFormaPagoConfig.findMany({
      where,
      orderBy: [
        { orden: 'asc' },
        { nombre: 'asc' }
      ]
    })
  } catch (error) {
    // Si la tabla no existe, retornar array vacío en lugar de lanzar error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      console.warn('Tabla tipos_forma_pago no existe aún. Ejecuta la migración de Prisma.')
      return []
    }
    throw error
  }
}

// Obtener tipo de forma de pago por ID
exports.findTipoFormaPagoById = async (id) => {
  try {
    return await prisma.tipoFormaPagoConfig.findUnique({
      where: { id }
    })
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      console.warn('Tabla tipos_forma_pago no existe aún. Ejecuta la migración de Prisma.')
      return null
    }
    throw error
  }
}

// Obtener tipo de forma de pago por código
exports.findTipoFormaPagoByCodigo = async (codigo) => {
  return await prisma.tipoFormaPagoConfig.findUnique({
    where: { codigo }
  })
}

// Crear nuevo tipo de forma de pago
exports.createTipoFormaPago = async (tipoData) => {
  // Verificar que el código no exista
  const tipoExistente = await prisma.tipoFormaPagoConfig.findUnique({
    where: { codigo: tipoData.codigo }
  })

  if (tipoExistente) {
    const error = new Error('Ya existe un tipo de forma de pago con este código.')
    error.status = 400
    throw error
  }

  return await prisma.tipoFormaPagoConfig.create({
    data: {
      codigo: tipoData.codigo,
      nombre: tipoData.nombre,
      descripcion: tipoData.descripcion || null,
      activo: tipoData.activo !== undefined ? tipoData.activo : true,
      icono: tipoData.icono || null,
      color: tipoData.color || null,
      orden: tipoData.orden || 0
    }
  })
}

// Actualizar tipo de forma de pago
exports.updateTipoFormaPago = async (id, updateData) => {
  const tipoExistente = await prisma.tipoFormaPagoConfig.findUnique({
    where: { id }
  })

  if (!tipoExistente) {
    const error = new Error('Tipo de forma de pago no encontrado.')
    error.status = 404
    throw error
  }

  // Si se actualiza el código, verificar que no exista otro con el mismo código
  if (updateData.codigo && updateData.codigo !== tipoExistente.codigo) {
    const tipoConCodigo = await prisma.tipoFormaPagoConfig.findUnique({
      where: { codigo: updateData.codigo }
    })

    if (tipoConCodigo) {
      const error = new Error('Ya existe otro tipo de forma de pago con este código.')
      error.status = 400
      throw error
    }
  }

  const dataToUpdate = {}
  if (updateData.codigo !== undefined) dataToUpdate.codigo = updateData.codigo
  if (updateData.nombre !== undefined) dataToUpdate.nombre = updateData.nombre
  if (updateData.descripcion !== undefined) dataToUpdate.descripcion = updateData.descripcion
  if (updateData.activo !== undefined) dataToUpdate.activo = updateData.activo
  if (updateData.icono !== undefined) dataToUpdate.icono = updateData.icono
  if (updateData.color !== undefined) dataToUpdate.color = updateData.color
  if (updateData.orden !== undefined) dataToUpdate.orden = updateData.orden

  return await prisma.tipoFormaPagoConfig.update({
    where: { id },
    data: dataToUpdate
  })
}

// Eliminar tipo de forma de pago
exports.deleteTipoFormaPago = async (id) => {
  const tipoExistente = await prisma.tipoFormaPagoConfig.findUnique({
    where: { id }
  })

  if (!tipoExistente) {
    const error = new Error('Tipo de forma de pago no encontrado.')
    error.status = 404
    throw error
  }

  // Valores válidos del enum TipoFormaPago
  const TIPOS_FORMAPAGO_VALIDOS = ['efectivo', 'terminal', 'transferencia', 'cheque', 'deposito', 'credito']
  
  // Verificar si hay formas de pago usando este tipo
  // Solo verificar si el código del tipo coincide con un valor válido del enum
  const codigoTipo = tipoExistente.codigo.toLowerCase()
  if (TIPOS_FORMAPAGO_VALIDOS.includes(codigoTipo)) {
    const formasPagoConTipo = await prisma.formaPago.findFirst({
      where: { tipo: codigoTipo }
    })

    if (formasPagoConTipo) {
      const error = new Error('No se puede eliminar este tipo porque está siendo usado por una o más formas de pago.')
      error.status = 400
      throw error
    }
  }

  return await prisma.tipoFormaPagoConfig.delete({
    where: { id }
  })
}

