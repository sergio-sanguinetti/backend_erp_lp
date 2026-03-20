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
    if (req.user && req.user.rol !== 'superAdministrador' && req.user.sede) {
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

    // Si aún no hay sedeId, buscar por su sede asignada
    if (!sedeId && req.user && req.user.rol !== 'superAdministrador' && req.user.sede) {
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


// Modificar pagos de un pedido (Oficina, Planta, Administrador)
exports.updatePagosPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { pagos } = req.body; // Array de pagos: [{ metodoId, monto, folio, tipo }]
    const rol = req.user?.rol;

    const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'No tienes permiso para modificar pagos' });
    }

    if (!pagos || !Array.isArray(pagos) || pagos.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos una forma de pago' });
    }

    const { prisma } = require('../../config/database');

    // Verificar que el pedido existe
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Eliminar pagos anteriores del pedido
    await prisma.pagoPedido.deleteMany({ where: { pedidoId: id } });

    // Crear los nuevos pagos
    const nuevosPagos = await Promise.all(pagos.map(pago =>
      prisma.pagoPedido.create({
        data: {
          pedidoId: id,
          metodoId: pago.metodoId || null,
          monto: parseFloat(pago.monto) || 0,
          folio: pago.folio || null,
          tipo: pago.tipo || 'metodo_pago',
        }
      })
    ));

    res.json({ message: 'Pagos actualizados correctamente', pagos: nuevosPagos });
  } catch (error) {
    console.error('Error updatePagosPedido:', error);
    res.status(500).json({ message: error.message || 'Error al actualizar pagos' });
  }
};

// Cancelar pedido (Oficina, Planta)
exports.cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = req.user?.rol;

    const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar pedidos' });
    }

    const { prisma } = require('../../config/database');
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { estado: 'cancelado' }
    });

    res.json({ message: 'Pedido cancelado', pedido });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== MÓDULO SBC (Salvo Buen Cobro) ==========

// Obtener pedidos con pago SBC pendiente de confirmación
exports.getPedidosSBC = async (req, res) => {
  try {
    const { prisma } = require('../../config/database');
    const { sedeId, rutaId, fechaDesde, fechaHasta } = req.query;

    const where = {
      estadoSBC: 'pendiente_confirmacion',
      estado: 'entregado'
    };

    if (sedeId) where.sedeId = sedeId;
    if (rutaId) where.rutaId = rutaId;
    if (fechaDesde || fechaHasta) {
      where.fechaPedido = {};
      if (fechaDesde) where.fechaPedido.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaPedido.lte = new Date(fechaHasta + 'T23:59:59');
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true, telefono: true } },
        ruta: { select: { id: true, nombre: true } },
        repartidor: { select: { id: true, nombres: true, apellidoPaterno: true } },
        sede: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaPedido: 'asc' }
    });

    const hoy = new Date();
    const resultado = pedidos.map(p => {
      const fechaPedido = new Date(p.fechaPedido);
      const diasPendiente = Math.floor((hoy - fechaPedido) / (1000 * 60 * 60 * 24));
      const formasPago = p.formasPago ? JSON.parse(p.formasPago) : null;
      return {
        id: p.id,
        numeroPedido: p.numeroPedido,
        cliente: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidoPaterno} ${p.cliente.apellidoMaterno || ''}`.trim() : 'Sin cliente',
        clienteId: p.clienteId,
        ruta: p.ruta?.nombre || 'Sin ruta',
        repartidor: p.repartidor ? `${p.repartidor.nombres} ${p.repartidor.apellidoPaterno}` : 'Sin repartidor',
        sede: p.sede?.nombre || 'Sin sede',
        ventaTotal: p.ventaTotal,
        tipoServicio: p.tipoServicio,
        fechaPedido: p.fechaPedido,
        diasPendiente,
        urgente: diasPendiente >= 3,
        formasPago,
        observacionesSBC: p.observacionesSBC
      };
    });

    res.json({ pedidos: resultado, total: resultado.length });
  } catch (error) {
    console.error('Error getPedidosSBC:', error);
    res.status(500).json({ message: error.message });
  }
};

// Confirmar o rechazar un pago SBC
exports.updateEstadoSBC = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoSBC, observacionesSBC } = req.body;
    const rol = req.user?.rol;

    const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'No tienes permiso para confirmar pagos SBC' });
    }

    if (!['confirmado', 'rechazado'].includes(estadoSBC)) {
      return res.status(400).json({ message: 'Estado SBC inválido. Use: confirmado o rechazado' });
    }

    const { prisma } = require('../../config/database');

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        estadoSBC,
        fechaConfirmacionSBC: new Date(),
        usuarioConfirmacionSBC: req.user.nombres || req.user.email,
        observacionesSBC: observacionesSBC || null
      }
    });

    res.json({ message: `Pago SBC ${estadoSBC} exitosamente`, pedido });
  } catch (error) {
    console.error('Error updateEstadoSBC:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== MÓDULO SBC (Salvo Buen Cobro) ==========

exports.getPedidosSBC = async (req, res) => {
  try {
    const { prisma } = require('../../config/database');
    const { sedeId, rutaId, fechaDesde, fechaHasta } = req.query;
    const where = { estadoSBC: 'pendiente_confirmacion', estado: 'entregado' };
    if (sedeId) where.sedeId = sedeId;
    if (rutaId) where.rutaId = rutaId;
    if (fechaDesde || fechaHasta) {
      where.fechaPedido = {};
      if (fechaDesde) where.fechaPedido.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaPedido.lte = new Date(fechaHasta + 'T23:59:59');
    }
    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true } },
        ruta: { select: { id: true, nombre: true } },
        repartidor: { select: { id: true, nombres: true, apellidoPaterno: true } },
        sede: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaPedido: 'asc' }
    });
    const hoy = new Date();
    const resultado = pedidos.map(p => {
      const dias = Math.floor((hoy - new Date(p.fechaPedido)) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        numeroPedido: p.numeroPedido,
        cliente: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidoPaterno}`.trim() : 'Sin cliente',
        clienteId: p.clienteId,
        ruta: p.ruta ? p.ruta.nombre : 'Sin ruta',
        repartidor: p.repartidor ? `${p.repartidor.nombres} ${p.repartidor.apellidoPaterno}` : 'Sin repartidor',
        sede: p.sede ? p.sede.nombre : 'Sin sede',
        ventaTotal: p.ventaTotal,
        tipoServicio: p.tipoServicio,
        fechaPedido: p.fechaPedido,
        diasPendiente: dias,
        urgente: dias >= 3,
        formasPago: p.formasPago ? JSON.parse(p.formasPago) : null,
        observacionesSBC: p.observacionesSBC
      };
    });
    res.json({ pedidos: resultado, total: resultado.length });
  } catch (error) {
    console.error('Error getPedidosSBC:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateEstadoSBC = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoSBC, observacionesSBC } = req.body;
    const rol = req.user ? req.user.rol : null;
    const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'No tienes permiso para confirmar pagos SBC' });
    }
    if (!['confirmado', 'rechazado'].includes(estadoSBC)) {
      return res.status(400).json({ message: 'Estado SBC invalido. Use: confirmado o rechazado' });
    }
    const { prisma } = require('../../config/database');
    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        estadoSBC,
        fechaConfirmacionSBC: new Date(),
        usuarioConfirmacionSBC: req.user.nombres || req.user.email,
        observacionesSBC: observacionesSBC || null
      }
    });
    res.json({ message: `Pago SBC ${estadoSBC} exitosamente`, pedido });
  } catch (error) {
    console.error('Error updateEstadoSBC:', error);
    res.status(500).json({ message: error.message });
  }
};


// ========== MÓDULO SBC (Salvo Buen Cobro) ==========

exports.getPedidosSBC = async (req, res) => {
  try {
    const { prisma } = require("../../config/database");
    const { sedeId, rutaId, fechaDesde, fechaHasta } = req.query;
    const where = { estadoSBC: "pendiente_confirmacion", estado: "entregado" };
    if (sedeId) where.sedeId = sedeId;
    if (rutaId) where.rutaId = rutaId;
    if (fechaDesde || fechaHasta) {
      where.fechaPedido = {};
      if (fechaDesde) where.fechaPedido.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaPedido.lte = new Date(fechaHasta + "T23:59:59");
    }
    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true } },
        ruta: { select: { id: true, nombre: true } },
        repartidor: { select: { id: true, nombres: true, apellidoPaterno: true } },
        sede: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaPedido: "asc" }
    });
    const hoy = new Date();
    const resultado = pedidos.map(p => {
      const dias = Math.floor((hoy - new Date(p.fechaPedido)) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        numeroPedido: p.numeroPedido,
        cliente: p.cliente ? (p.cliente.nombre + " " + p.cliente.apellidoPaterno).trim() : "Sin cliente",
        clienteId: p.clienteId,
        ruta: p.ruta ? p.ruta.nombre : "Sin ruta",
        repartidor: p.repartidor ? (p.repartidor.nombres + " " + p.repartidor.apellidoPaterno) : "Sin repartidor",
        sede: p.sede ? p.sede.nombre : "Sin sede",
        ventaTotal: p.ventaTotal,
        tipoServicio: p.tipoServicio,
        fechaPedido: p.fechaPedido,
        diasPendiente: dias,
        urgente: dias >= 3,
        formasPago: p.formasPago ? JSON.parse(p.formasPago) : null,
        observacionesSBC: p.observacionesSBC
      };
    });
    res.json({ pedidos: resultado, total: resultado.length });
  } catch (error) {
    console.error("Error getPedidosSBC:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateEstadoSBC = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoSBC, observacionesSBC } = req.body;
    const rol = req.user ? req.user.rol : null;
    const rolesPermitidos = ["superAdministrador", "administrador", "oficina", "planta"];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: "No tienes permiso para confirmar pagos SBC" });
    }
    if (!["confirmado", "rechazado"].includes(estadoSBC)) {
      return res.status(400).json({ message: "Estado SBC invalido. Use: confirmado o rechazado" });
    }
    const { prisma } = require("../../config/database");
    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        estadoSBC,
        fechaConfirmacionSBC: new Date(),
        usuarioConfirmacionSBC: req.user.nombres || req.user.email,
        observacionesSBC: observacionesSBC || null
      }
    });
    res.json({ message: "Pago SBC " + estadoSBC + " exitosamente", pedido });
  } catch (error) {
    console.error("Error updateEstadoSBC:", error);
    res.status(500).json({ message: error.message });
  }
};
