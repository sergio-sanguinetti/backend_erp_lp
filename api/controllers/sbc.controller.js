const { prisma } = require('../../config/database');

const SBC_METODOS = ['TRANSFERENCIA', 'CHEQUE', 'DEPOSITO'];
const ROLES_SANLUIS = ['superAdministrador', 'administrador'];
const ROLES_OFICINA = ['superAdministrador', 'administrador', 'oficina', 'planta'];

const getNombreUsuario = (user) => {
  if (!user) return 'Sistema';
  const nombre = [user.nombres, user.apellidoPaterno].filter(Boolean).join(' ');
  return nombre || user.email || 'Usuario';
};

exports.getPagosSbc = async (req, res) => {
  try {
    const { sedeId, estado } = req.query;
    let whereBase = { tipo: 'metodo_pago', metodo: { nombre: { in: SBC_METODOS } }, pedido: { estado: 'entregado' } };
    if (req.user && req.user.rol !== 'superAdministrador' && req.user.sede) {
      const sede = await prisma.sede.findFirst({ where: { OR: [{ id: req.user.sede }, { nombre: req.user.sede }] } });
      if (sede) whereBase.pedido = { ...whereBase.pedido, sedeId: sede.id };
    } else if (sedeId) { whereBase.pedido = { ...whereBase.pedido, sedeId }; }
    if (estado && estado !== 'todos') {
      if (estado === 'pendiente') whereBase.OR = [{ estadoSbc: 'pendiente' }, { estadoSbc: null }];
      else whereBase.estadoSbc = estado;
    }
    const pagos = await prisma.pagoPedido.findMany({
      where: whereBase, orderBy: { fecha: 'desc' }, take: 200,
      select: {
        id: true, monto: true, folio: true, fecha: true,
        estadoSbc: true, folioConfirmado: true, notaConfirmacion: true,
        confirmadoPorOficina: true, fechaConfOficina: true,
        confirmadoPorSanLuis: true, fechaConfSanLuis: true,
        metodo: { select: { nombre: true } },
        pedido: {
          select: {
            id: true, numeroPedido: true, fechaPedido: true, horaPedido: true,
            tipoServicio: true, ventaTotal: true,
            cliente: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true } },
            ruta: { select: { nombre: true } },
            repartidor: { select: { nombres: true, apellidoPaterno: true } }
          }
        }
      }
    });
    res.json(pagos.map(p => ({
      id: p.id, pedidoId: p.pedido.id, numeroPedido: p.pedido.numeroPedido,
      fechaPedido: p.pedido.fechaPedido, horaPedido: p.pedido.horaPedido,
      tipoServicio: p.pedido.tipoServicio, ventaTotal: p.pedido.ventaTotal,
      cliente: p.pedido.cliente ? [p.pedido.cliente.nombre, p.pedido.cliente.apellidoPaterno, p.pedido.cliente.apellidoMaterno].filter(Boolean).join(' ') : 'Sin cliente',
      ruta: p.pedido.ruta ? p.pedido.ruta.nombre : 'Sin ruta',
      repartidor: p.pedido.repartidor ? [p.pedido.repartidor.nombres, p.pedido.repartidor.apellidoPaterno].filter(Boolean).join(' ') : 'Sin operador',
      metodoPago: p.metodo ? p.metodo.nombre : 'N/A', monto: p.monto, folioOriginal: p.folio,
      estadoSbc: p.estadoSbc || 'pendiente', folioConfirmado: p.folioConfirmado,
      notaConfirmacion: p.notaConfirmacion, confirmadoPorOficina: p.confirmadoPorOficina,
      fechaConfOficina: p.fechaConfOficina, confirmadoPorSanLuis: p.confirmadoPorSanLuis, fechaConfSanLuis: p.fechaConfSanLuis,
    })));
  } catch (error) { console.error('Error getPagosSbc:', error); res.status(500).json({ message: error.message }); }
};

exports.confirmarOficina = async (req, res) => {
  try {
    if (!req.user || !ROLES_OFICINA.includes(req.user.rol)) return res.status(403).json({ message: 'No tienes permiso para confirmar como Oficina.' });
    const { id } = req.params;
    const { folioConfirmado, notaConfirmacion } = req.body;
    await prisma.pagoPedido.update({ where: { id }, data: { estadoSbc: 'confirmado_oficina', folioConfirmado: folioConfirmado || null, notaConfirmacion: notaConfirmacion || null, confirmadoPorOficina: getNombreUsuario(req.user), fechaConfOficina: new Date() } });
    res.json({ message: 'Confirmado por oficina' });
  } catch (error) { console.error('Error confirmarOficina:', error); res.status(500).json({ message: error.message }); }
};

exports.confirmarSanLuis = async (req, res) => {
  try {
    if (!req.user || !ROLES_SANLUIS.includes(req.user.rol)) return res.status(403).json({ message: 'Solo Administrador o SuperAdministrador puede confirmar como San Luis.' });
    const { id } = req.params;
    const { notaConfirmacion } = req.body;
    await prisma.pagoPedido.update({ where: { id }, data: { estadoSbc: 'confirmado_sanluis', notaConfirmacion: notaConfirmacion || null, confirmadoPorSanLuis: getNombreUsuario(req.user), fechaConfSanLuis: new Date() } });
    res.json({ message: 'Confirmado por San Luis' });
  } catch (error) { console.error('Error confirmarSanLuis:', error); res.status(500).json({ message: error.message }); }
};

exports.rechazarSbc = async (req, res) => {
  try {
    if (!req.user || !ROLES_OFICINA.includes(req.user.rol)) return res.status(403).json({ message: 'No tienes permiso para rechazar pagos.' });
    const { id } = req.params;
    const { notaConfirmacion } = req.body;
    await prisma.pagoPedido.update({ where: { id }, data: { estadoSbc: 'rechazado', notaConfirmacion: notaConfirmacion || null, confirmadoPorOficina: getNombreUsuario(req.user), fechaConfOficina: new Date() } });
    res.json({ message: 'Pago rechazado' });
  } catch (error) { console.error('Error rechazarSbc:', error); res.status(500).json({ message: error.message }); }
};

// Reactivar pago rechazado → vuelve a pendiente
const reactivarPago = async (req, res) => {
  const { id } = req.params
  const { notaConfirmacion } = req.body
  const ROLES_OFICINA = ['superAdministrador', 'administrador', 'oficina', 'planta']
  if (!req.user || !ROLES_OFICINA.includes(req.user.rol)) {
    return res.status(403).json({ message: 'No tienes permiso para reactivar pagos.' })
  }
  try {
    await prisma.pagoPedido.update({
      where: { id },
      data: {
        estadoSbc: 'pendiente',
        notaConfirmacion: notaConfirmacion ? `[Reactivado por ${getNombreUsuario(req.user)}] ${notaConfirmacion}` : `Reactivado por ${getNombreUsuario(req.user)}`,
        confirmadoPorOficina: null,
        fechaConfOficina: null,
        confirmadoPorSanLuis: null,
        fechaConfSanLuis: null,
      }
    })
    res.json({ message: 'Pago reactivado' })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

module.exports = { ...module.exports, reactivarPago }
