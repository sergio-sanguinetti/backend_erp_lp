const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTodayBoundsMexico, getMexicoCityDayBounds } = require('../utils/timezoneMexico');

/** Agrupa montos por tipo de forma de pago (efectivo, transferencia, tarjeta, etc.) */
function agruparFormasPagoPedidos(pedidos) {
  const resumen = { efectivo: 0, transferencia: 0, tarjeta: 0, cheque: 0, credito: 0, otros: 0 };
  pedidos.forEach(p => {
    if (!p.formasPago) return;
    try {
      const fp = typeof p.formasPago === 'string' ? JSON.parse(p.formasPago) : p.formasPago;
      const items = Array.isArray(fp) ? fp : (fp?.items || []);
      items.forEach(f => {
        const monto = parseFloat(f.monto || 0);
        const tipo = (f.tipo || f.nombre || '').toLowerCase();
        if (tipo.includes('efectivo')) resumen.efectivo += monto;
        else if (tipo.includes('transferencia')) resumen.transferencia += monto;
        else if (tipo.includes('tarjeta') || tipo.includes('terminal')) resumen.tarjeta += monto;
        else if (tipo.includes('cheque')) resumen.cheque += monto;
        else if (tipo.includes('credito')) resumen.credito += monto;
        else resumen.otros += monto;
      });
    } catch (e) {
      console.error('Error parsing formasPago for pedido', p.id, e);
    }
  });
  return resumen;
}

/** Agrupa montos de abonos por tipo de forma de pago según nombre de FormaPago */
function agruparFormasPagoAbonos(abonos) {
  const resumen = { efectivo: 0, transferencia: 0, tarjeta: 0, cheque: 0, credito: 0, otros: 0 };
  abonos.forEach(a => {
    const tipo = (a.formaPago?.nombre || '').toLowerCase();
    const monto = parseFloat(a.monto || 0);
    if (tipo.includes('efectivo')) resumen.efectivo += monto;
    else if (tipo.includes('transferencia')) resumen.transferencia += monto;
    else if (tipo.includes('tarjeta') || tipo.includes('terminal')) resumen.tarjeta += monto;
    else if (tipo.includes('cheque')) resumen.cheque += monto;
    else if (tipo.includes('credito')) resumen.credito += monto;
    else resumen.otros += monto;
  });
  return resumen;
}

class CorteCajaService {
  async getTodaySummary(usuarioId) {
    const { start: todayStart, end: todayEnd } = getTodayBoundsMexico();

    // Obtener pedidos del repartidor hoy (día en Ciudad de México) con cliente para mostrar nombre en corte
    const pedidos = await prisma.pedido.findMany({
      where: {
        repartidorId: usuarioId,
        fechaPedido: {
          gte: todayStart,
          lte: todayEnd
        },
        estado: 'entregado'
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        }
      }
    });

    // Obtener abonos del repartidor hoy (día en Ciudad de México) con cliente para mostrar nombre en corte
    const abonos = await prisma.abonoCliente.findMany({
      where: {
        usuarioRegistro: usuarioId,
        fecha: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        formaPago: true
      }
    });

    // Cargar formas de pago para resolver formaPagoId -> tipo/nombre (la app envía formaPagoId y tipo 'metodo_pago')
    const formasPagoRows = await prisma.formaPago.findMany({
      where: { activa: true },
      select: { id: true, tipo: true, nombre: true }
    });
    const formaPagoMap = {};
    formasPagoRows.forEach(f => {
      formaPagoMap[f.id] = { tipo: (f.tipo || '').toLowerCase(), nombre: (f.nombre || '').toLowerCase() };
    });

    function getTipoFromItem(f) {
      const rawTipo = (f.tipo || '').toLowerCase();
      if (rawTipo.includes('efectivo') || rawTipo.includes('credito') || rawTipo.includes('transferencia') || rawTipo.includes('cheque') || rawTipo.includes('tarjeta') || rawTipo.includes('terminal')) return rawTipo;
      const resolved = formaPagoMap[f.formaPagoId];
      if (resolved) return resolved.tipo || resolved.nombre || '';
      return (f.nombre || '').toLowerCase();
    }

    // Calcular totales por forma de pago de pedidos
    // Nota: Los pedidos tienen un campo formasPago que es un string JSON (puede ser array o { items: [] })
    const stats = {
      sales: pedidos.length,
      totalSales: 0,
      totalAbonos: 0,
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      cheque: 0,
      credito: 0,
      otros: 0
    };

    pedidos.forEach(p => {
      stats.totalSales += p.ventaTotal;
      if (p.formasPago) {
        try {
          const fp = typeof p.formasPago === 'string' ? JSON.parse(p.formasPago) : p.formasPago;
          const items = Array.isArray(fp) ? fp : (fp?.items || []);
          items.forEach(f => {
            const monto = parseFloat(f.monto || 0);
            const tipo = getTipoFromItem(f);
            if (tipo.includes('efectivo')) stats.efectivo += monto;
            else if (tipo.includes('transferencia')) stats.transferencia += monto;
            else if (tipo.includes('tarjeta') || tipo.includes('terminal')) stats.tarjeta += monto;
            else if (tipo.includes('cheque')) stats.cheque += monto;
            else if (tipo.includes('credito')) stats.credito += monto;
            else if (tipo.includes('deposito')) stats.otros += monto;
            else stats.otros += monto;
          });
        } catch (e) {
          console.error('Error parsing formasPago for pedido', p.id, e);
        }
      }
    });

    abonos.forEach(a => {
      stats.totalAbonos += a.monto;
      const tipo = (a.formaPago?.nombre || '').toLowerCase();
      if (tipo.includes('efectivo')) stats.efectivo += a.monto;
      else if (tipo.includes('transferencia')) stats.transferencia += a.monto;
      else if (tipo.includes('tarjeta') || tipo.includes('terminal')) stats.tarjeta += a.monto;
      else if (tipo.includes('cheque')) stats.cheque += a.monto;
      else stats.otros += a.monto;
    });

    return {
      pedidos,
      abonos,
      stats
    };
  }

  async checkExistingCorte(usuarioId, tipo) {
    const { start: todayStart, end: todayEnd } = getTodayBoundsMexico();

    const corte = await prisma.corteCaja.findFirst({
      where: {
        repartidorId: usuarioId,
        tipo: tipo,
        fecha: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    return corte;
  }

  async createCorte(data) {
    const {
      repartidorId,
      tipo,
      totalVentas,
      totalAbonos,
      totalEfectivo,
      totalOtros,
      observaciones,
      detalles,
      depositos,
      stats,
      dailySales
    } = data;

    // Debug: Ver qué datos están llegando al backend
    console.log('🔍 [Backend] createCorte - Datos recibidos:', {
      repartidorId,
      tipo,
      totalVentas,
      totalAbonos,
      dailySales: dailySales ? `Array con ${dailySales.length} items` : 'NULL',
      stats: stats ? 'Objeto presente' : 'NULL',
      statsContent: stats
    });

    const today = new Date();
    const dia = today.toISOString().split('T')[0];

    // Verificar si ya existe un corte para hoy
    const existing = await this.checkExistingCorte(repartidorId, tipo);
    if (existing) {
      throw new Error(`Ya se ha generado un corte de tipo ${tipo} el día de hoy.`);
    }

    // Extract totalLitros and totalProductosUnidades from stats if available
    const totalLitros = stats?.totalLitros || 0;
    const totalProductosUnidades = stats?.totalProductosUnidades || 0;

    return await prisma.corteCaja.create({
      data: {
        repartidorId,
        tipo,
        dia,
        totalVentas,
        totalAbonos,
        totalEfectivo,
        totalOtros,
        observaciones,
        stats: stats ? JSON.stringify(stats) : null,
        dailySales: dailySales ? JSON.stringify(dailySales) : null,
        totalLitros,
        totalProductosUnidades,
        detalles: {
          create: detalles.map(d => ({
            referenciaId: d.referenciaId,
            tipoReferencia: d.tipoReferencia,
            monto: d.monto,
            formaPago: d.formaPago
          }))
        },
        depositos: {
          create: (depositos || []).map(dep => ({
            monto: parseFloat(dep.amount || 0),
            folio: dep.folio,
            billetesRechazados: parseFloat(dep.rejectedBills || 0),
            monedas: parseFloat(dep.coins || 0),
            total: parseFloat(dep.totalAmount || 0)
          }))
        }
      }
    });
  }

  async getAllCortes() {
    const cortes = await prisma.corteCaja.findMany({
      include: {
        repartidor: true,
        depositos: true,
        detalles: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    const cortesEnriquecidos = await Promise.all(
      cortes.map(async (corte) => {
        const { start, end } = getMexicoCityDayBounds(corte.dia);
        let resumenFormasPagoVenta = null;
        let resumenFormasPagoAbono = null;

        if (corte.tipo === 'venta_dia') {
          console.log(`🔍 [Backend] Buscando pedidos para corte ${corte.id}:`, {
            repartidorId: corte.repartidorId,
            dia: corte.dia,
            rangoFechas: { start, end },
            fechaCorte: corte.fecha
          });

          const pedidos = await prisma.pedido.findMany({
            where: {
              repartidorId: corte.repartidorId,
              fechaPedido: { gte: start, lte: end },
              estado: 'entregado'
            },
            select: { formasPago: true, id: true, fechaPedido: true }
          });

          console.log(`🔍 [Backend] Pedidos encontrados para corte ${corte.id}:`, {
            total: pedidos.length,
            conFormasPago: pedidos.filter(p => p.formasPago).length,
            ejemploFormasPago: pedidos[0]?.formasPago,
            pedidosFechas: pedidos.map(p => ({ id: p.id, fecha: p.fechaPedido }))
          });

          resumenFormasPagoVenta = agruparFormasPagoPedidos(pedidos);

          // Fallback: Si no se encontraron pedidos (0 ventas) pero tenemos detalles en el corte
          const totalCalculado = Object.values(resumenFormasPagoVenta).reduce((a, b) => a + b, 0);

          if (totalCalculado === 0 && corte.detalles && corte.detalles.length > 0) {
            console.log(`⚠️ [Backend] Usando DETALLES del corte como fallback para formas de pago venta (Corte ID: ${corte.id})`);
            // Reiniciar resumen
            resumenFormasPagoVenta = { efectivo: 0, transferencia: 0, tarjeta: 0, cheque: 0, credito: 0, otros: 0 };

            corte.detalles.forEach(d => {
              // Filtrar solo detalles que NO sean abonos (asumiendo que abonos se marcan como tal)
              // O incluir solo 'pedido' / 'venta' si estamos seguros
              const tipoRef = (d.tipoReferencia || '').toLowerCase();
              if (tipoRef.includes('abono')) return; // Ignorar abonos en corte de venta

              const monto = parseFloat(d.monto || 0);
              const tipo = (d.formaPago || '').toLowerCase();

              if (tipo.includes('efectivo')) resumenFormasPagoVenta.efectivo += monto;
              else if (tipo.includes('transferencia')) resumenFormasPagoVenta.transferencia += monto;
              else if (tipo.includes('tarjeta') || tipo.includes('terminal')) resumenFormasPagoVenta.tarjeta += monto;
              else if (tipo.includes('cheque')) resumenFormasPagoVenta.cheque += monto;
              else if (tipo.includes('credito')) resumenFormasPagoVenta.credito += monto;
              else resumenFormasPagoVenta.otros += monto;
            });
          }
          // Fallback Legacy: Usar stats si no hay detalles y todo falló
          else if (totalCalculado === 0 && corte.stats) {
            try {
              const statsParsed = typeof corte.stats === 'string' ? JSON.parse(corte.stats) : corte.stats;
              // Usamos stats si tiene datos, PERO intentamos ser inteligentes
              // Si stats tiene totalAbonos > 0, sabemos que está sucio.
              if (statsParsed) {
                // Si hay abonos en stats, NO podemos confiar en el desglose de stats para venta pura
                // A menos que restemos... pero no sabemos qué restar de qué forma.
                // Mejor advertir.
                if (statsParsed.totalAbonos > 0) {
                  console.warn(`⚠️ [Backend] Stats fallback tiene abonos mezclados. Intentando usar solo lo que parece venta.`);
                  // Sin embargo, si no hay otra opción, mostramos lo que hay.
                  // El usuario reportó que "cheque" aparecía (era abono).
                  // Si pudiéramos saber que el abono fue cheque...
                }

                console.log(`⚠️ [Backend] Usando stats de BD como fallback (Legacy) para venta (Corte ID: ${corte.id})`);
                resumenFormasPagoVenta = {
                  efectivo: statsParsed.efectivo || 0,
                  transferencia: statsParsed.transferencia || 0,
                  tarjeta: statsParsed.tarjeta || 0,
                  cheque: statsParsed.cheque || 0,
                  credito: statsParsed.credito || 0,
                  otros: statsParsed.otros || 0
                };
              }
            } catch (e) { console.error('Error parsing stats fallback', e); }
          }

          console.log(`✅ [Backend] Resumen formas de pago venta:`, resumenFormasPagoVenta);
        }

        if (corte.tipo === 'abono') {
          const abonos = await prisma.abonoCliente.findMany({
            where: {
              usuarioRegistro: corte.repartidorId,
              fecha: { gte: start, lte: end }
            },
            include: { formaPago: true }
          });
          resumenFormasPagoAbono = agruparFormasPagoAbonos(abonos);

          // Fallback para abonos
          const totalCalculado = Object.values(resumenFormasPagoAbono).reduce((a, b) => a + b, 0);

          if (totalCalculado === 0 && corte.detalles && corte.detalles.length > 0) {
            console.log(`⚠️ [Backend] Usando DETALLES del corte como fallback para formas de pago ABONO (Corte ID: ${corte.id})`);
            resumenFormasPagoAbono = { efectivo: 0, transferencia: 0, tarjeta: 0, cheque: 0, credito: 0, otros: 0 };

            corte.detalles.forEach(d => {
              const tipoRef = (d.tipoReferencia || '').toLowerCase();
              if (!tipoRef.includes('abono')) return; // Solo incluir abonos

              const monto = parseFloat(d.monto || 0);
              const tipo = (d.formaPago || '').toLowerCase();

              if (tipo.includes('efectivo')) resumenFormasPagoAbono.efectivo += monto;
              else if (tipo.includes('transferencia')) resumenFormasPagoAbono.transferencia += monto;
              else if (tipo.includes('tarjeta') || tipo.includes('terminal')) resumenFormasPagoAbono.tarjeta += monto;
              else if (tipo.includes('cheque')) resumenFormasPagoAbono.cheque += monto;
              else if (tipo.includes('credito')) resumenFormasPagoAbono.credito += monto;
              else resumenFormasPagoAbono.otros += monto;
            });
          }
          else if (totalCalculado === 0 && corte.stats) {
            try {
              const statsParsed = typeof corte.stats === 'string' ? JSON.parse(corte.stats) : corte.stats;
              if (statsParsed && (statsParsed.efectivo || statsParsed.transferencia || statsParsed.tarjeta || statsParsed.cheque || statsParsed.credito || statsParsed.otros)) {
                console.log(`⚠️ [Backend] Usando stats de BD como fallback para formas de pago abono (Corte ID: ${corte.id})`);
                resumenFormasPagoAbono = {
                  efectivo: statsParsed.efectivo || 0,
                  transferencia: statsParsed.transferencia || 0,
                  tarjeta: statsParsed.tarjeta || 0,
                  cheque: statsParsed.cheque || 0,
                  credito: statsParsed.credito || 0, // Posiblemente debería ser 0 para abonos?
                  otros: statsParsed.otros || 0
                };
              }
            } catch (e) { }
          }
        }

        return {
          ...corte,
          resumenFormasPagoVenta,
          resumenFormasPagoAbono
        };
      })
    );

    return cortesEnriquecidos;
  }

  async getCortesByRepartidor(usuarioId) {
    return await prisma.corteCaja.findMany({
      where: { repartidorId: usuarioId },
      include: {
        repartidor: true,
        depositos: true,
        detalles: true
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async getCorteById(id, usuarioId = null) {
    const where = { id };
    if (usuarioId) {
      where.repartidorId = usuarioId;
    }
    const corte = await prisma.corteCaja.findFirst({
      where,
      include: {
        repartidor: true,
        depositos: true,
        detalles: true
      }
    });

    if (!corte) return null;

    // Parse JSON fields
    if (corte.stats && typeof corte.stats === 'string') {
      try {
        corte.stats = JSON.parse(corte.stats);
      } catch (e) {
        console.error('Error parsing stats:', e);
      }
    }
    if (corte.dailySales && typeof corte.dailySales === 'string') {
      try {
        corte.dailySales = JSON.parse(corte.dailySales);
      } catch (e) {
        console.error('Error parsing dailySales:', e);
      }
    }

    return corte;
  }

  async getCorteResumenPorTipoServicio(tipoServicio, sedeId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Obtener todos los cortes del día para el tipo de servicio (pipas o cilindros)
    const cortes = await prisma.corteCaja.findMany({
      where: {
        fecha: {
          gte: today,
          lt: tomorrow
        },
        repartidor: {
          tipoRepartidor: tipoServicio.toLowerCase() === 'pipas' ? 'pipas' : 'cilindros',
          ...(sedeId ? { sede: sedeId } : {})
        }
      },
      include: {
        repartidor: true
      }
    });

    // Obtener rutas programadas para hoy
    const rutasProgramadas = await prisma.ruta.count({
      where: {
        ...(sedeId ? { sedeId } : {}),
        repartidores: {
          some: {
            usuario: {
              tipoRepartidor: tipoServicio.toLowerCase() === 'pipas' ? 'pipas' : 'cilindros'
            }
          }
        }
      }
    });

    const resumen = {
      rutasProgramadas,
      cortesEntregados: cortes.length,
      cortesValidados: cortes.filter(c => c.estado === 'validado').length,
      cortesPendientes: cortes.filter(c => c.estado === 'pendiente').length,
      totalVentas: cortes.reduce((sum, c) => sum + c.totalVentas, 0),
      totalServicios: cortes.reduce((sum, c) => sum + c.totalVentas, 0), // Simplificado
      totalAbonos: cortes.reduce((sum, c) => sum + c.totalAbonos, 0)
    };

    return resumen;
  }

  async validateCorte(corteId, data) {
    const { estado, observaciones, validaciones } = data;

    // Verificar que el corte existe
    const corte = await prisma.corteCaja.findUnique({
      where: { id: corteId }
    });

    if (!corte) {
      throw new Error('Corte no encontrado');
    }

    // Actualizar el estado del corte
    return await prisma.corteCaja.update({
      where: { id: corteId },
      data: {
        estado: estado || 'validado',
        observaciones: observaciones || corte.observaciones
      },
      include: {
        repartidor: true,
        depositos: true,
        detalles: true
      }
    });
  }
}

module.exports = new CorteCajaService();











