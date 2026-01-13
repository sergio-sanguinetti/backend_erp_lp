const { prisma } = require('../config/database');

// Ventas por mes
exports.getVentasPorMes = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {
    estado: 'entregado',
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta),
    };
  }
  if (sedeId) {
    where.sedeId = sedeId;
  }

  const ventas = await prisma.pedido.findMany({
    where,
    select: {
      fechaPedido: true,
      ventaTotal: true,
    },
  });

  // Agrupar por mes
  const ventasPorMes = {};
  ventas.forEach((venta) => {
    const fecha = new Date(venta.fechaPedido);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    if (!ventasPorMes[mes]) {
      ventasPorMes[mes] = {
        mes: nombreMes,
        total: 0,
        cantidad: 0,
      };
    }
    ventasPorMes[mes].total += parseFloat(venta.ventaTotal) || 0;
    ventasPorMes[mes].cantidad += 1;
  });

  return Object.values(ventasPorMes).sort((a, b) => {
    const fechaA = new Date(a.mes);
    const fechaB = new Date(b.mes);
    return fechaA - fechaB;
  });
};

// Cortes por mes
exports.getCortesPorMes = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {};

  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) {
      where.fecha.gte = new Date(fechaDesde);
    }
    if (fechaHasta) {
      where.fecha.lte = new Date(fechaHasta);
    }
  }

  const cortes = await prisma.corteCaja.findMany({
    where,
    include: {
      repartidor: {
        select: {
          sede: true,
        },
      },
    },
  });

  // Filtrar por sede si se especifica
  let cortesFiltrados = cortes;
  if (sedeId) {
    cortesFiltrados = cortes.filter((corte) => corte.repartidor?.sede === sedeId);
  }

  // Agrupar por mes
  const cortesPorMes = {};
  cortesFiltrados.forEach((corte) => {
    const fecha = new Date(corte.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    if (!cortesPorMes[mes]) {
      cortesPorMes[mes] = {
        mes: nombreMes,
        cantidad: 0,
        totalVentas: 0,
        totalAbonos: 0,
        totalEfectivo: 0,
      };
    }
    cortesPorMes[mes].cantidad += 1;
    cortesPorMes[mes].totalVentas += parseFloat(corte.totalVentas) || 0;
    cortesPorMes[mes].totalAbonos += parseFloat(corte.totalAbonos) || 0;
    cortesPorMes[mes].totalEfectivo += parseFloat(corte.totalEfectivo) || 0;
  });

  return Object.values(cortesPorMes).sort((a, b) => {
    const fechaA = new Date(a.mes);
    const fechaB = new Date(b.mes);
    return fechaA - fechaB;
  });
};

// Dinero entregado por cortes por mes
exports.getDineroEntregadoPorCortes = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {};

  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) {
      where.fecha.gte = new Date(fechaDesde);
    }
    if (fechaHasta) {
      where.fecha.lte = new Date(fechaHasta);
    }
  }

  const cortes = await prisma.corteCaja.findMany({
    where,
    include: {
      repartidor: {
        select: {
          sede: true,
        },
      },
      depositos: true,
    },
  });

  // Filtrar por sede si se especifica
  let cortesFiltrados = cortes;
  if (sedeId) {
    cortesFiltrados = cortes.filter((corte) => corte.repartidor?.sede === sedeId);
  }

  // Agrupar por mes
  const dineroPorMes = {};
  cortesFiltrados.forEach((corte) => {
    const fecha = new Date(corte.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    if (!dineroPorMes[mes]) {
      dineroPorMes[mes] = {
        mes: nombreMes,
        totalEntregado: 0,
        cantidadCortes: 0,
      };
    }
    
    const totalDepositos = corte.depositos.reduce((sum, dep) => sum + (parseFloat(dep.total) || 0), 0);
    dineroPorMes[mes].totalEntregado += totalDepositos;
    dineroPorMes[mes].cantidadCortes += 1;
  });

  return Object.values(dineroPorMes).sort((a, b) => {
    const fechaA = new Date(a.mes);
    const fechaB = new Date(b.mes);
    return fechaA - fechaB;
  });
};

// Clientes por zona
exports.getClientesPorZona = async (sedeId) => {
  const where = {};
  
  if (sedeId) {
    // Filtrar por sede a través de la ruta
    where.ruta = {
      sedeId: sedeId,
    };
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      zona: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  // Agrupar por zona
  const clientesPorZona = {};
  clientes.forEach((cliente) => {
    const zonaNombre = cliente.zona?.nombre || 'Sin zona';
    const zonaId = cliente.zona?.id || 'sin-zona';
    
    if (!clientesPorZona[zonaId]) {
      clientesPorZona[zonaId] = {
        zona: zonaNombre,
        cantidad: 0,
      };
    }
    clientesPorZona[zonaId].cantidad += 1;
  });

  return Object.values(clientesPorZona);
};

// Estadísticas de créditos
exports.getEstadisticasCreditos = async (sedeId) => {
  const where = {};
  
  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    select: {
      estado: true,
      saldoPendiente: true,
    },
  });

  const estadisticas = {
    activos: 0,
    pagados: 0,
    deuda: 0,
    totalNotas: notasCredito.length,
    montoTotal: 0,
  };

  notasCredito.forEach((nota) => {
    const saldo = parseFloat(nota.saldoPendiente) || 0;
    estadisticas.montoTotal += saldo;

    if (nota.estado === 'pagada') {
      estadisticas.pagados += 1;
    } else if (nota.estado === 'vigente' || nota.estado === 'por_vencer') {
      estadisticas.activos += 1;
      estadisticas.deuda += saldo;
    } else if (nota.estado === 'vencida') {
      estadisticas.activos += 1;
      estadisticas.deuda += saldo;
    }
  });

  return estadisticas;
};

// Créditos por mes
exports.getCreditosPorMes = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {};

  if (fechaDesde) {
    where.fechaVenta = {
      ...where.fechaVenta,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaVenta = {
      ...where.fechaVenta,
      lte: new Date(fechaHasta),
    };
  }

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    select: {
      fechaVenta: true,
      importe: true,
      saldoPendiente: true,
      estado: true,
    },
  });

  // Agrupar por mes
  const creditosPorMes = {};
  notasCredito.forEach((nota) => {
    const fecha = new Date(nota.fechaVenta);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    if (!creditosPorMes[mes]) {
      creditosPorMes[mes] = {
        mes: nombreMes,
        cantidad: 0,
        totalImporte: 0,
        totalSaldo: 0,
      };
    }
    creditosPorMes[mes].cantidad += 1;
    creditosPorMes[mes].totalImporte += parseFloat(nota.importe) || 0;
    creditosPorMes[mes].totalSaldo += parseFloat(nota.saldoPendiente) || 0;
  });

  return Object.values(creditosPorMes).sort((a, b) => {
    const fechaA = new Date(a.mes);
    const fechaB = new Date(b.mes);
    return fechaA - fechaB;
  });
};

// Ventas por tipo de servicio
exports.getVentasPorTipoServicio = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {
    estado: 'entregado',
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta),
    };
  }
  if (sedeId) {
    where.sedeId = sedeId;
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    select: {
      tipoServicio: true,
      ventaTotal: true,
    },
  });

  const ventasPorTipo = {};
  pedidos.forEach((pedido) => {
    const tipo = pedido.tipoServicio || 'sin_tipo';
    if (!ventasPorTipo[tipo]) {
      ventasPorTipo[tipo] = {
        tipo: tipo,
        cantidad: 0,
        total: 0,
      };
    }
    ventasPorTipo[tipo].cantidad += 1;
    ventasPorTipo[tipo].total += parseFloat(pedido.ventaTotal) || 0;
  });

  return Object.values(ventasPorTipo);
};

// Ventas por forma de pago
exports.getVentasPorFormaPago = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {
    estado: 'entregado',
  };

  if (fechaDesde) {
    where.fechaPedido = {
      ...where.fechaPedido,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaPedido = {
      ...where.fechaPedido,
      lte: new Date(fechaHasta),
    };
  }
  if (sedeId) {
    where.sedeId = sedeId;
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      pagos: true,
    },
    select: {
      id: true,
      ventaTotal: true,
      formasPago: true,
      pagos: {
        select: {
          monto: true,
          tipo: true,
          metodoId: true,
        },
      },
    },
  });

  const ventasPorFormaPago = {};
  
  // Obtener todas las formas de pago para poder buscar por metodoId
  const formasPagoMap = {};
  try {
    const formasPago = await prisma.formaPago.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });
    formasPago.forEach((fp) => {
      formasPagoMap[fp.id] = fp.nombre;
    });
  } catch (error) {
    console.error('Error al obtener formas de pago:', error);
  }

  pedidos.forEach((pedido) => {
    let formasPagoUsadas = [];

    // Intentar parsear el campo formasPago si es JSON
    if (pedido.formasPago) {
      try {
        const formasPagoJson = JSON.parse(pedido.formasPago);
        if (Array.isArray(formasPagoJson)) {
          formasPagoUsadas = formasPagoJson;
        } else if (formasPagoJson.formasPago && Array.isArray(formasPagoJson.formasPago)) {
          formasPagoUsadas = formasPagoJson.formasPago;
        }
      } catch (e) {
        // Si no es JSON válido, continuar
      }
    }

    // Si hay pagos en PagoPedido, usar esos
    if (pedido.pagos && pedido.pagos.length > 0) {
      pedido.pagos.forEach((pago) => {
        let formaPagoNombre = 'Sin forma de pago';
        
        if (pago.metodoId && formasPagoMap[pago.metodoId]) {
          formaPagoNombre = formasPagoMap[pago.metodoId];
        } else if (pago.tipo) {
          formaPagoNombre = pago.tipo;
        }

        if (!ventasPorFormaPago[formaPagoNombre]) {
          ventasPorFormaPago[formaPagoNombre] = {
            formaPago: formaPagoNombre,
            cantidad: 0,
            total: 0,
          };
        }
        ventasPorFormaPago[formaPagoNombre].cantidad += 1;
        ventasPorFormaPago[formaPagoNombre].total += parseFloat(pago.monto) || 0;
      });
    } else if (formasPagoUsadas.length > 0) {
      // Usar las formas de pago del JSON
      formasPagoUsadas.forEach((fp) => {
        const formaPagoNombre = fp.nombre || fp.formaPago || 'Sin forma de pago';
        const monto = parseFloat(fp.monto) || parseFloat(pedido.ventaTotal) / formasPagoUsadas.length;

        if (!ventasPorFormaPago[formaPagoNombre]) {
          ventasPorFormaPago[formaPagoNombre] = {
            formaPago: formaPagoNombre,
            cantidad: 0,
            total: 0,
          };
        }
        ventasPorFormaPago[formaPagoNombre].cantidad += 1;
        ventasPorFormaPago[formaPagoNombre].total += monto;
      });
    } else {
      // Si no hay información de forma de pago, usar "Efectivo" por defecto
      const formaPagoNombre = 'Efectivo';
      if (!ventasPorFormaPago[formaPagoNombre]) {
        ventasPorFormaPago[formaPagoNombre] = {
          formaPago: formaPagoNombre,
          cantidad: 0,
          total: 0,
        };
      }
      ventasPorFormaPago[formaPagoNombre].cantidad += 1;
      ventasPorFormaPago[formaPagoNombre].total += parseFloat(pedido.ventaTotal) || 0;
    }
  });

  return Object.values(ventasPorFormaPago);
};

// Resumen general
exports.getResumenGeneral = async (fechaDesde, fechaHasta, sedeId) => {
  const wherePedidos = {
    estado: 'entregado',
  };

  if (fechaDesde) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      lte: new Date(fechaHasta),
    };
  }
  if (sedeId) {
    wherePedidos.sedeId = sedeId;
  }

  const pedidos = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      ventaTotal: true,
      cantidadProductos: true,
    },
  });

  const totalVentas = pedidos.reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);
  const totalProductos = pedidos.reduce((sum, p) => sum + (p.cantidadProductos || 0), 0);
  const cantidadPedidos = pedidos.length;

  const estadisticasCreditos = await this.getEstadisticasCreditos(sedeId);
  const clientesPorZona = await this.getClientesPorZona(sedeId);
  const totalClientes = clientesPorZona.reduce((sum, z) => sum + z.cantidad, 0);

  return {
    totalVentas,
    cantidadPedidos,
    totalProductos,
    totalClientes,
    creditos: estadisticasCreditos,
  };
};

