const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTodayBoundsMexico } = require('../utils/timezoneMexico');

/**
 * Resumen de ventas del día para el dashboard (ventasHoy, pedidos, efectivo, etc.).
 * @param {string|null} sedeId - ID de sede para filtrar (opcional)
 * @returns {Promise<{ ventasHoy, crecimientoPorcentaje, pedidosCreados, pedidosEntregados, alertasCriticas, efectivoConsolidado }>}
 */
async function getResumenDia(sedeId) {
  const { start: todayStart, end: todayEnd } = getTodayBoundsMexico();

  const wherePedidos = {
    fechaPedido: {
      gte: todayStart,
      lte: todayEnd
    }
  };
  if (sedeId) {
    wherePedidos.sedeId = sedeId;
  }

  const pedidosHoy = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      id: true,
      estado: true,
      ventaTotal: true
    }
  });

  const pedidosCreados = pedidosHoy.length;
  const pedidosEntregados = pedidosHoy.filter(p => p.estado === 'entregado').length;
  const ventasHoy = pedidosHoy
    .filter(p => p.estado === 'entregado')
    .reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);

  const whereCortes = {
    fecha: {
      gte: todayStart,
      lte: todayEnd
    }
  };
  if (sedeId) {
    whereCortes.repartidor = {
      sede: sedeId
    };
  }

  const cortesHoy = await prisma.corteCaja.findMany({
    where: whereCortes,
    select: { totalEfectivo: true }
  });

  const efectivoConsolidado = cortesHoy.reduce((sum, c) => sum + (parseFloat(c.totalEfectivo) || 0), 0);

  return {
    ventasHoy,
    crecimientoPorcentaje: 0,
    pedidosCreados,
    pedidosEntregados,
    alertasCriticas: 0,
    efectivoConsolidado
  };
}

module.exports = {
  getResumenDia
};
