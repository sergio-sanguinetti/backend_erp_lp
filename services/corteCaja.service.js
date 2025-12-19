const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CorteCajaService {
  async getTodaySummary(usuarioId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Obtener pedidos del repartidor hoy
    const pedidos = await prisma.pedido.findMany({
      where: {
        repartidorId: usuarioId,
        fechaPedido: {
          gte: today,
          lt: tomorrow
        },
        estado: 'entregado'
      }
    });

    // Obtener abonos del repartidor hoy
    const abonos = await prisma.abonoCliente.findMany({
      where: {
        usuarioRegistro: usuarioId,
        fecha: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        formaPago: true
      }
    });

    // Calcular totales por forma de pago de pedidos
    // Nota: Los pedidos tienen un campo formasPago que es un string JSON
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
          const fp = JSON.parse(p.formasPago);
          fp.forEach(f => {
            const monto = parseFloat(f.monto || 0);
            const tipo = (f.tipo || '').toLowerCase();
            if (tipo.includes('efectivo')) stats.efectivo += monto;
            else if (tipo.includes('transferencia')) stats.transferencia += monto;
            else if (tipo.includes('tarjeta') || tipo.includes('terminal')) stats.tarjeta += monto;
            else if (tipo.includes('cheque')) stats.cheque += monto;
            else if (tipo.includes('credito')) stats.credito += monto;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const corte = await prisma.corteCaja.findFirst({
      where: {
        repartidorId: usuarioId,
        tipo: tipo,
        fecha: {
          gte: today,
          lt: tomorrow
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
      depositos 
    } = data;

    const today = new Date();
    const dia = today.toISOString().split('T')[0];

    // Verificar si ya existe un corte para hoy
    const existing = await this.checkExistingCorte(repartidorId, tipo);
    if (existing) {
      throw new Error(`Ya se ha generado un corte de tipo ${tipo} el día de hoy.`);
    }

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
    return await prisma.corteCaja.findMany({
      include: {
        repartidor: true,
        depositos: true,
        detalles: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });
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
}

module.exports = new CorteCajaService();

