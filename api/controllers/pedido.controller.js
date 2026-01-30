const pedidoService = require('../../services/pedido.service');
const usuarioService = require('../../services/usuario.service');
const notificationService = require('../../services/notification.service');

// Obtener todos los pedidos
exports.getAllPedidos = async (req, res, next) => {
  try {
    // Obtener filtros de los query parameters
    const filtros = {};
    if (req.query.fechaDesde) filtros.fechaDesde = req.query.fechaDesde;
    if (req.query.fechaHasta) filtros.fechaHasta = req.query.fechaHasta;
    if (req.query.clienteId) filtros.clienteId = req.query.clienteId;
    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipoServicio) filtros.tipoServicio = req.query.tipoServicio;
    if (req.query.repartidorId) filtros.repartidorId = req.query.repartidorId;
    if (req.query.sedeId) filtros.sedeId = req.query.sedeId;
    if (req.query.rutaId) filtros.rutaId = req.query.rutaId;

    // Repartidores solo ven sus propios pedidos: forzar repartidorId con el usuario autenticado
    if (req.user && req.user.rol === 'repartidor' && req.user.id) {
      filtros.repartidorId = req.user.id;
    }

    // Si el usuario no es superAdministrador, filtrar por su sede automáticamente
    if (req.user && req.user.rol === 'administrador' && req.user.sede && !filtros.sedeId) {
      // Buscar la sede por nombre para obtener el ID
      const { prisma } = require('../../config/database');
      const sede = await prisma.sede.findFirst({
        where: {
          OR: [
            { id: req.user.sede },
            { nombre: req.user.sede }
          ]
        }
      });
      if (sede) {
        filtros.sedeId = sede.id;
      }
    }

    console.log('Filtros de pedidos recibidos:', filtros);
    console.log('Usuario:', { id: req.user?.id, rol: req.user?.rol, sede: req.user?.sede });

    const pedidos = await pedidoService.getAllPedidos(filtros);
    
    console.log('Pedidos encontrados:', pedidos.length);

    res.status(200).json(pedidos);
  } catch (error) {
    next(error);
  }
};

// Obtener pedido por ID
exports.getPedidoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pedido = await pedidoService.findPedidoById(id);

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    res.status(200).json(pedido);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo pedido
exports.createPedido = async (req, res, next) => {
  try {
    // Obtener la sede del usuario si no se proporciona
    let sedeId = req.body.sedeId;
    
    if (!sedeId && req.user && req.user.sede) {
      // Buscar la sede por nombre para obtener el ID
      const { prisma } = require('../../config/database');
      const sede = await prisma.sede.findFirst({
        where: {
          OR: [
            { id: req.user.sede },
            { nombre: req.user.sede }
          ]
        }
      });
      if (sede) {
        sedeId = sede.id;
      } else {
        // Si no se encuentra por nombre, intentar usar directamente el valor del usuario
        // (puede ser que ya sea un ID)
        sedeId = req.user.sede;
      }
    }

    // Si aún no hay sedeId y el usuario es administrador, buscar por su sede asignada
    if (!sedeId && req.user && req.user.rol === 'administrador' && req.user.sede) {
      const { prisma } = require('../../config/database');
      // Buscar la sede por nombre (el campo sede en Usuario es string con el nombre)
      const sede = await prisma.sede.findFirst({
        where: {
          nombre: req.user.sede
        }
      });
      if (sede) {
        sedeId = sede.id;
      }
    }

    const pedidoData = {
      ...req.body,
      sedeId: sedeId || null
    };

    console.log('Creando pedido con sedeId:', sedeId, 'Usuario sede:', req.user?.sede);

    const pedido = await pedidoService.createPedido(pedidoData);

    // Notificación push al repartidor cuando se le asigna un pedido
    if (pedido.repartidorId) {
      try {
        const repartidor = await usuarioService.findUsuarioById(pedido.repartidorId);
        if (repartidor && repartidor.pushToken) {
          const clienteNombre = pedido.cliente
            ? [pedido.cliente.nombre, pedido.cliente.apellidoPaterno, pedido.cliente.apellidoMaterno].filter(Boolean).join(' ')
            : 'Cliente';
          await notificationService.sendPedidoAsignadoToRepartidor(repartidor.pushToken, {
            titulo: 'Nuevo pedido asignado',
            cuerpo: `Pedido ${pedido.numeroPedido} - ${clienteNombre}. Revisa la app para más detalles.`,
            pedidoId: pedido.id,
            numeroPedido: pedido.numeroPedido,
          });
        }
      } catch (notifError) {
        console.error('[Pedido] Error al enviar notificación push al repartidor:', notifError.message);
      }
    }

    res.status(201).json({
      message: 'Pedido creado exitosamente.',
      pedido
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar pedido
exports.updatePedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pedido = await pedidoService.updatePedido(id, updateData);

    res.status(200).json({
      message: 'Pedido actualizado exitosamente.',
      pedido
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar pedido
exports.deletePedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pedidoService.deletePedido(id);

    res.status(200).json({
      message: 'Pedido eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

