const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTodayBoundsMexico } = require('../utils/timezoneMexico');

const FACTOR_KG_A_LITROS = 0.51854;

async function getResumenDia(sedeId, fechaDesde, fechaHasta) {
  const { getTodayBoundsMexico, getMexicoCityDayBounds } = require('../utils/timezoneMexico');

  let wherePedidos;

  if (fechaDesde || fechaHasta) {
    // Custom date range
    wherePedidos = {};
    if (fechaDesde && fechaHasta) {
      const startBounds = getMexicoCityDayBounds(fechaDesde);
      const endBounds = getMexicoCityDayBounds(fechaHasta);
      wherePedidos.fechaPedido = { gte: startBounds.start, lte: endBounds.end };
    } else if (fechaDesde) {
      const startBounds = getMexicoCityDayBounds(fechaDesde);
      wherePedidos.fechaPedido = { gte: startBounds.start };
    } else {
      const endBounds = getMexicoCityDayBounds(fechaHasta);
      wherePedidos.fechaPedido = { lte: endBounds.end };
    }
  } else {
    // Today only (original logic with offline fix)
    const { start: todayStart, end: todayEnd, dateStr } = getTodayBoundsMexico();
    const prefixHoy = "PED-" + dateStr.replace(/-/g, "") + "-";
    const midnightUTC = new Date(dateStr + "T00:00:00.000Z");
    wherePedidos = {
      OR: [
        { fechaPedido: { gte: todayStart, lte: todayEnd } },
        { fechaPedido: midnightUTC, numeroPedido: { startsWith: prefixHoy } }
      ]
    };
  }

  if (sedeId) {
    if (wherePedidos.OR) {
      wherePedidos.OR = wherePedidos.OR.map(w => ({ ...w, sedeId }));
    } else {
      wherePedidos.sedeId = sedeId;
    }
  }

  const pedidosHoy = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      id: true,
      estado: true,
      ventaTotal: true,
      tipoServicio: true,
      calculoPipas: true,
      productosPedido: {
        select: {
          cantidad: true,
          producto: {
            select: {
              cantidadKilos: true
            }
          }
        }
      },
      pagos: {
        select: {
          monto: true,
          tipo: true,
          metodo: { select: { tipo: true } }
        }
      }
    }
  });

  const pedidosCreados = pedidosHoy.length;
  const pedidosEntregados = pedidosHoy.filter(p => p.estado === 'entregado').length;

  const ventasHoy = pedidosHoy
    .filter(p => p.estado === 'entregado')
    .reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);

  const ventasPipas = pedidosHoy
    .filter(p => p.estado === 'entregado' && p.tipoServicio === 'pipas')
    .reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);

  const ventasCilindros = pedidosHoy
    .filter(p => p.estado === 'entregado' && p.tipoServicio === 'cilindros')
    .reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);

  const efectivoHoy = pedidosHoy
    .filter(p => p.estado === 'entregado')
    .reduce((sum, p) => {
      const ef = (p.pagos || [])
        .filter(pago => pago.metodo?.tipo === 'efectivo')
        .reduce((s, pago) => s + (parseFloat(pago.monto) || 0), 0);
      return sum + ef;
    }, 0);

  const creditoHoy = pedidosHoy
    .filter(p => p.estado === 'entregado')
    .reduce((sum, p) => {
      const cr = (p.pagos || [])
        .filter(pago => pago.tipo === 'credito')
        .reduce((s, pago) => s + (parseFloat(pago.monto) || 0), 0);
      return sum + cr;
    }, 0);

  const litrosPipas = pedidosHoy
    .filter(p => p.estado === 'entregado' && p.tipoServicio === 'pipas')
    .reduce((sum, p) => {
      try {
        const calc = typeof p.calculoPipas === 'string' ? JSON.parse(p.calculoPipas) : p.calculoPipas;
        if (!calc) return sum;
        if (Array.isArray(calc)) {
          return sum + calc.reduce((s, carga) => s + (parseFloat(carga.cantidadLitros) || 0), 0);
        }
        return sum + (parseFloat(calc.cantidadLitros) || 0);
      } catch {
        return sum;
      }
    }, 0);

  const kgCilindros = pedidosHoy
    .filter(p => p.estado === 'entregado' && p.tipoServicio === 'cilindros')
    .reduce((sum, p) => {
      const kg = (p.productosPedido || []).reduce((s, pp) => {
        const kilos = parseFloat(pp.producto?.cantidadKilos) || 0;
        const cantidad = parseFloat(pp.cantidad) || 0;
        return s + (kilos * cantidad);
      }, 0);
      return sum + kg;
    }, 0);

  const litrosCilindros = kgCilindros / FACTOR_KG_A_LITROS;
  const litrosTotales = litrosPipas + litrosCilindros;

  return {
    ventasHoy,
    crecimientoPorcentaje: 0,
    pedidosCreados,
    pedidosEntregados,
    alertasCriticas: 0,
    efectivoConsolidado: efectivoHoy,
    efectivoHoy,
    creditoHoy: Math.round(creditoHoy * 100) / 100,
    ventasPipas: Math.round(ventasPipas * 100) / 100,
    ventasCilindros: Math.round(ventasCilindros * 100) / 100,
    litrosPipas: Math.round(litrosPipas * 100) / 100,
    litrosCilindros: Math.round(litrosCilindros * 100) / 100,
    litrosTotales: Math.round(litrosTotales * 100) / 100
  };
}



async function getResumenPorRepartidor(sedeId, fechaDesde, fechaHasta) {
  const { getTodayBoundsMexico, getMexicoCityDayBounds } = require('../utils/timezoneMexico');
  const { prisma } = require('../config/database');

  const baseWhere = { estado: "entregado", repartidorId: { not: null } };
  if (sedeId) baseWhere.sedeId = sedeId;

  let wherePedidos;

  if (fechaDesde || fechaHasta) {
    wherePedidos = { ...baseWhere };
    if (fechaDesde && fechaHasta) {
      const startBounds = getMexicoCityDayBounds(fechaDesde);
      const endBounds = getMexicoCityDayBounds(fechaHasta);
      wherePedidos.fechaPedido = { gte: startBounds.start, lte: endBounds.end };
    } else if (fechaDesde) {
      const startBounds = getMexicoCityDayBounds(fechaDesde);
      wherePedidos.fechaPedido = { gte: startBounds.start };
    } else {
      const endBounds = getMexicoCityDayBounds(fechaHasta);
      wherePedidos.fechaPedido = { lte: endBounds.end };
    }
  } else {
    const { start: todayStart, end: todayEnd, dateStr } = getTodayBoundsMexico();
    const prefixHoy = "PED-" + dateStr.replace(/-/g, "") + "-";
    const midnightUTC = new Date(dateStr + "T00:00:00.000Z");
    wherePedidos = {
      ...baseWhere,
      OR: [
        { fechaPedido: { gte: todayStart, lte: todayEnd } },
        { fechaPedido: midnightUTC, numeroPedido: { startsWith: prefixHoy } }
      ]
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      id: true, ventaTotal: true, tipoServicio: true, calculoPipas: true,
      repartidor: { select: { id: true, nombres: true, apellidoPaterno: true, tipoRepartidor: true } },
      productosPedido: {
        select: {
          cantidad: true,
          producto: {
            select: {
              cantidadKilos: true,
              nombre: true,
              categoria: { select: { codigo: true } }
            }
          }
        }
      }
    }
  });

  const mapa = {};
  for (const ped of pedidos) {
    if (!ped.repartidor) continue;
    const rid = ped.repartidor.id;
    if (!mapa[rid]) {
      mapa[rid] = {
        id: rid,
        nombre: ped.repartidor.nombres + " " + ped.repartidor.apellidoPaterno,
        tipo: ped.repartidor.tipoRepartidor,
        servicios: 0,
        totalVentas: 0,
        litros: 0,
        cil10: 0, cil20: 0, cil30: 0,
        tanque10: 0, tanque20: 0, tanque30: 0,
        valvulas: 0
      };
    }
    const r = mapa[rid];
    r.servicios += 1;
    r.totalVentas += parseFloat(ped.ventaTotal) || 0;

    if (ped.tipoServicio === "pipas") {
      try {
        const c = typeof ped.calculoPipas === "string" ? JSON.parse(ped.calculoPipas) : ped.calculoPipas;
        if (c) {
          if (Array.isArray(c)) {
            r.litros += c.reduce((s, carga) => s + (parseFloat(carga.cantidadLitros) || 0), 0);
          } else {
            r.litros += parseFloat(c.cantidadLitros) || 0;
          }
        }
      } catch(e) {}
    }

    for (const pp of ped.productosPedido || []) {
      const codigo = pp.producto && pp.producto.categoria && pp.producto.categoria.codigo;
      const kg = parseFloat(pp.producto && pp.producto.cantidadKilos) || 0;
      const cant = parseInt(pp.cantidad) || 0;

      if (codigo === "cilindros") {
        if (kg === 10) r.cil10 += cant;
        else if (kg === 20) r.cil20 += cant;
        else if (kg === 30) r.cil30 += cant;
        r.litros += (kg * cant) / 0.51854;
      } else if (codigo === "tanques_nuevos") {
        if (kg === 10) r.tanque10 += cant;
        else if (kg === 20) r.tanque20 += cant;
        else if (kg === 30) r.tanque30 += cant;
      } else if (codigo === "val") {
        r.valvulas += cant;
      }
    }
  }

  const pipas = Object.values(mapa).filter(r => r.tipo === "pipas").sort((a,b) => b.totalVentas - a.totalVentas);
  const cilindros = Object.values(mapa).filter(r => r.tipo === "cilindros").sort((a,b) => b.totalVentas - a.totalVentas);

  return { pipas, cilindros };
}

module.exports = { getResumenDia, getResumenPorRepartidor };

