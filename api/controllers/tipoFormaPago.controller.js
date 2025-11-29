const tipoFormaPagoService = require('../../services/tipoFormaPago.service')

// Obtener todos los tipos de formas de pago
exports.getAllTiposFormaPago = async (req, res, next) => {
  try {
    const filtros = {}
    if (req.query.activo) filtros.activo = req.query.activo
    if (req.query.codigo) filtros.codigo = req.query.codigo
    if (req.query.nombre) filtros.nombre = req.query.nombre

    const tipos = await tipoFormaPagoService.getAllTiposFormaPago(filtros)
    res.status(200).json(tipos)
  } catch (error) {
    next(error)
  }
}

// Obtener tipo de forma de pago por ID
exports.getTipoFormaPagoById = async (req, res, next) => {
  try {
    const { id } = req.params
    const tipo = await tipoFormaPagoService.findTipoFormaPagoById(id)

    if (!tipo) {
      return res.status(404).json({ message: 'Tipo de forma de pago no encontrado.' })
    }

    res.status(200).json(tipo)
  } catch (error) {
    next(error)
  }
}

// Crear nuevo tipo de forma de pago
exports.createTipoFormaPago = async (req, res, next) => {
  try {
    const tipo = await tipoFormaPagoService.createTipoFormaPago(req.body)

    res.status(201).json({
      message: 'Tipo de forma de pago creado exitosamente.',
      tipo
    })
  } catch (error) {
    next(error)
  }
}

// Actualizar tipo de forma de pago
exports.updateTipoFormaPago = async (req, res, next) => {
  try {
    const { id } = req.params
    const tipo = await tipoFormaPagoService.updateTipoFormaPago(id, req.body)

    res.status(200).json({
      message: 'Tipo de forma de pago actualizado exitosamente.',
      tipo
    })
  } catch (error) {
    next(error)
  }
}

// Eliminar tipo de forma de pago
exports.deleteTipoFormaPago = async (req, res, next) => {
  try {
    const { id } = req.params
    await tipoFormaPagoService.deleteTipoFormaPago(id)

    res.status(200).json({
      message: 'Tipo de forma de pago eliminado exitosamente.'
    })
  } catch (error) {
    next(error)
  }
}

