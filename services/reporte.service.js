const { prisma } = require('../config/database');

// Obtener ventas por mes
exports.getVentasPorMes = async (fechaDesde, fechaHasta) => {
  const where = {
    estado: 'entregado'
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta)
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    select: {
      fechaPedido: true,
      ventaTotal: true
    }
  });

  // Agrupar por mes
  const ventasPorMes = {};
  pedidos.forEach(pedido => {
    const fecha = new Date(pedido.fechaPedido);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    
    if (!ventasPorMes[mes]) {
      ventasPorMes[mes] = {
        mes,
        mesNombre,
        total: 0,
        cantidad: 0
      };
    }
    ventasPorMes[mes].total += pedido.ventaTotal;
    ventasPorMes[mes].cantidad += 1;
  });

  return Object.values(ventasPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
};

// Obtener cortes por mes
exports.getCortesPorMes = async (fechaDesde, fechaHasta) => {
  const where = {};

  if (fechaDesde) {
    where.fecha = {
      ...where.fecha,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fecha = {
      ...where.fecha,
      lte: new Date(fechaHasta)
    };
  }

  const cortes = await prisma.corteCaja.findMany({
    where,
    select: {
      fecha: true,
      tipo: true,
      estado: true
    }
  });

  // Agrupar por mes
  const cortesPorMes = {};
  cortes.forEach(corte => {
    const fecha = new Date(corte.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    
    if (!cortesPorMes[mes]) {
      cortesPorMes[mes] = {
        mes,
        mesNombre,
        cantidad: 0,
        validados: 0,
        pendientes: 0
      };
    }
    cortesPorMes[mes].cantidad += 1;
    if (corte.estado === 'validado') {
      cortesPorMes[mes].validados += 1;
    } else if (corte.estado === 'pendiente') {
      cortesPorMes[mes].pendientes += 1;
    }
  });

  return Object.values(cortesPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
};

// Obtener cantidad de dinero entregado por cortes por mes
exports.getDineroEntregadoPorCortes = async (fechaDesde, fechaHasta) => {
  const where = {
    estado: 'validado'
  };

  if (fechaDesde) {
    where.fecha = {
      ...where.fecha,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fecha = {
      ...where.fecha,
      lte: new Date(fechaHasta)
    };
  }

  const cortes = await prisma.corteCaja.findMany({
    where,
    select: {
      fecha: true,
      totalVentas: true,
      totalAbonos: true,
      totalEfectivo: true,
      totalOtros: true
    }
  });

  // Agrupar por mes
  const dineroPorMes = {};
  cortes.forEach(corte => {
    const fecha = new Date(corte.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    const total = (corte.totalVentas || 0) + (corte.totalAbonos || 0);
    
    if (!dineroPorMes[mes]) {
      dineroPorMes[mes] = {
        mes,
        mesNombre,
        total: 0,
        totalVentas: 0,
        totalAbonos: 0,
        totalEfectivo: 0,
        totalOtros: 0
      };
    }
    dineroPorMes[mes].total += total;
    dineroPorMes[mes].totalVentas += corte.totalVentas || 0;
    dineroPorMes[mes].totalAbonos += corte.totalAbonos || 0;
    dineroPorMes[mes].totalEfectivo += corte.totalEfectivo || 0;
    dineroPorMes[mes].totalOtros += corte.totalOtros || 0;
  });

  return Object.values(dineroPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
};

// Obtener cantidad de clientes por zona
exports.getClientesPorZona = async () => {
  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCliente: 'activo'
    },
    include: {
      zona: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });

  // Agrupar por zona
  const clientesPorZona = {};
  clientes.forEach(cliente => {
    const zonaId = cliente.zonaId || 'sin-zona';
    const zonaNombre = cliente.zona?.nombre || 'Sin Zona';
    
    if (!clientesPorZona[zonaId]) {
      clientesPorZona[zonaId] = {
        zonaId,
        zonaNombre,
        cantidad: 0
      };
    }
    clientesPorZona[zonaId].cantidad += 1;
  });

  return Object.values(clientesPorZona).sort((a, b) => b.cantidad - a.cantidad);
};

// Obtener estadísticas de créditos
exports.getEstadisticasCreditos = async (fechaDesde, fechaHasta) => {
  const where = {};

  if (fechaDesde) {
    where.fechaVenta = {
      ...where.fechaVenta,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaVenta = {
      ...where.fechaVenta,
      lte: new Date(fechaHasta)
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    select: {
      estado: true,
      importe: true,
      saldoPendiente: true
    }
  });

  const estadisticas = {
    activos: 0,
    pagados: 0,
    deuda: 0,
    totalImporte: 0,
    totalSaldoPendiente: 0
  };

  notasCredito.forEach(nota => {
    if (nota.estado === 'vigente' || nota.estado === 'por_vencer' || nota.estado === 'vencida') {
      estadisticas.activos += 1;
    }
    if (nota.estado === 'pagada') {
      estadisticas.pagados += 1;
    }
    estadisticas.totalImporte += nota.importe || 0;
    estadisticas.totalSaldoPendiente += nota.saldoPendiente || 0;
  });

  estadisticas.deuda = estadisticas.totalSaldoPendiente;

  return estadisticas;
};

// Obtener créditos por mes
exports.getCreditosPorMes = async (fechaDesde, fechaHasta) => {
  const where = {};

  if (fechaDesde) {
    where.fechaVenta = {
      ...where.fechaVenta,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaVenta = {
      ...where.fechaVenta,
      lte: new Date(fechaHasta)
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    select: {
      fechaVenta: true,
      estado: true,
      importe: true,
      saldoPendiente: true
    }
  });

  // Agrupar por mes
  const creditosPorMes = {};
  notasCredito.forEach(nota => {
    const fecha = new Date(nota.fechaVenta);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    
    if (!creditosPorMes[mes]) {
      creditosPorMes[mes] = {
        mes,
        mesNombre,
        activos: 0,
        pagados: 0,
        vencidos: 0,
        totalImporte: 0,
        totalSaldoPendiente: 0
      };
    }
    
    if (nota.estado === 'vigente' || nota.estado === 'por_vencer') {
      creditosPorMes[mes].activos += 1;
    } else if (nota.estado === 'pagada') {
      creditosPorMes[mes].pagados += 1;
    } else if (nota.estado === 'vencida') {
      creditosPorMes[mes].vencidos += 1;
    }
    
    creditosPorMes[mes].totalImporte += nota.importe || 0;
    creditosPorMes[mes].totalSaldoPendiente += nota.saldoPendiente || 0;
  });

  return Object.values(creditosPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
};

// Obtener ventas por tipo de servicio
exports.getVentasPorTipoServicio = async (fechaDesde, fechaHasta) => {
  const where = {
    estado: 'entregado'
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta)
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    select: {
      tipoServicio: true,
      ventaTotal: true
    }
  });

  const ventasPorTipo = {
    pipas: { cantidad: 0, total: 0 },
    cilindros: { cantidad: 0, total: 0 }
  };

  pedidos.forEach(pedido => {
    if (pedido.tipoServicio === 'pipas') {
      ventasPorTipo.pipas.cantidad += 1;
      ventasPorTipo.pipas.total += pedido.ventaTotal || 0;
    } else if (pedido.tipoServicio === 'cilindros') {
      ventasPorTipo.cilindros.cantidad += 1;
      ventasPorTipo.cilindros.total += pedido.ventaTotal || 0;
    }
  });

  return ventasPorTipo;
};

// Obtener ventas por forma de pago
exports.getVentasPorFormaPago = async (fechaDesde, fechaHasta) => {
  const where = {
    estado: 'entregado'
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta)
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    select: {
      formasPago: true,
      ventaTotal: true,
      montoPagado: true,
      pagos: {
        select: {
          tipo: true,
          monto: true
        }
      }
    }
  });

  const ventasPorFormaPago = {};

  pedidos.forEach(pedido => {
    // Intentar parsear formasPago desde JSON
    let formasPagoData = [];
    if (pedido.formasPago) {
      try {
        formasPagoData = typeof pedido.formasPago === 'string' 
          ? JSON.parse(pedido.formasPago) 
          : pedido.formasPago;
        if (!Array.isArray(formasPagoData)) {
          formasPagoData = [];
        }
      } catch (e) {
        formasPagoData = [];
      }
    }

    // Si hay formas de pago en el JSON
    if (formasPagoData.length > 0) {
      formasPagoData.forEach((fp) => {
        const nombre = fp.nombre || fp.formaPago || 'Desconocido';
        const tipo = fp.tipo || 'desconocido';
        const monto = fp.monto || (pedido.ventaTotal / formasPagoData.length);
        
        if (!ventasPorFormaPago[nombre]) {
          ventasPorFormaPago[nombre] = {
            nombre,
            tipo,
            cantidad: 0,
            total: 0
          };
        }
        ventasPorFormaPago[nombre].cantidad += 1;
        ventasPorFormaPago[nombre].total += monto;
      });
    } else if (pedido.pagos && pedido.pagos.length > 0) {
      // Si no hay formas de pago en JSON, usar los pagos
      pedido.pagos.forEach(pago => {
        const tipo = pago.tipo === 'credito' ? 'Crédito' : 'Efectivo';
        const nombre = tipo;
        
        if (!ventasPorFormaPago[nombre]) {
          ventasPorFormaPago[nombre] = {
            nombre,
            tipo: tipo.toLowerCase(),
            cantidad: 0,
            total: 0
          };
        }
        ventasPorFormaPago[nombre].cantidad += 1;
        ventasPorFormaPago[nombre].total += pago.monto || 0;
      });
    } else {
      // Si no hay información de pago, usar efectivo por defecto
      const nombre = 'Efectivo';
      if (!ventasPorFormaPago[nombre]) {
        ventasPorFormaPago[nombre] = {
          nombre,
          tipo: 'efectivo',
          cantidad: 0,
          total: 0
        };
      }
      ventasPorFormaPago[nombre].cantidad += 1;
      ventasPorFormaPago[nombre].total += pedido.montoPagado || pedido.ventaTotal || 0;
    }
  });

  return Object.values(ventasPorFormaPago);
};

// Obtener resumen general de reportes
exports.getResumenGeneral = async (fechaDesde, fechaHasta) => {
  const [
    ventasPorMes,
    cortesPorMes,
    dineroEntregado,
    clientesPorZona,
    estadisticasCreditos,
    creditosPorMes,
    ventasPorTipoServicio,
    ventasPorFormaPago
  ] = await Promise.all([
    exports.getVentasPorMes(fechaDesde, fechaHasta),
    exports.getCortesPorMes(fechaDesde, fechaHasta),
    exports.getDineroEntregadoPorCortes(fechaDesde, fechaHasta),
    exports.getClientesPorZona(),
    exports.getEstadisticasCreditos(fechaDesde, fechaHasta),
    exports.getCreditosPorMes(fechaDesde, fechaHasta),
    exports.getVentasPorTipoServicio(fechaDesde, fechaHasta),
    exports.getVentasPorFormaPago(fechaDesde, fechaHasta)
  ]);

  return {
    ventasPorMes,
    cortesPorMes,
    dineroEntregado,
    clientesPorZona,
    estadisticasCreditos,
    creditosPorMes,
    ventasPorTipoServicio,
    ventasPorFormaPago
  };
};

