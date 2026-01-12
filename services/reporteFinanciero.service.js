const { prisma } = require('../config/database');

// Antigüedad de Cartera (30, 60, 90+ días)
exports.getAntiguedadCartera = async () => {
  const notasCredito = await prisma.notaCredito.findMany({
    where: {
      estado: {
        in: ['vigente', 'por_vencer', 'vencida']
      }
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          ruta: {
            select: {
              nombre: true
            }
          }
        }
      }
    }
  });

  const hoy = new Date();
  const antiguedad = {
    menos30: [],
    entre30y60: [],
    entre60y90: [],
    mas90: []
  };

  notasCredito.forEach(nota => {
    const fechaVencimiento = new Date(nota.fechaVencimiento);
    const diasVencidos = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
    
    const item = {
      numeroNota: nota.numeroNota,
      cliente: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno || ''}`.trim(),
      telefono: nota.cliente.telefono,
      ruta: nota.cliente.ruta?.nombre || 'Sin ruta',
      fechaVenta: nota.fechaVenta,
      fechaVencimiento: nota.fechaVencimiento,
      importe: nota.importe,
      saldoPendiente: nota.saldoPendiente,
      diasVencidos: diasVencidos,
      estado: nota.estado
    };

    if (diasVencidos < 0) {
      // Aún no vence
      return;
    } else if (diasVencidos <= 30) {
      antiguedad.menos30.push(item);
    } else if (diasVencidos <= 60) {
      antiguedad.entre30y60.push(item);
    } else if (diasVencidos <= 90) {
      antiguedad.entre60y90.push(item);
    } else {
      antiguedad.mas90.push(item);
    }
  });

  return antiguedad;
};

// Top 10 Mejores Pagadores
exports.getTopMejoresPagadores = async (limite = 10) => {
  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCliente: 'activo'
    },
    include: {
      notasCredito: {
        where: {
          estado: 'pagada'
        }
      },
      abonos: true,
      ruta: {
        select: {
          nombre: true
        }
      }
    }
  });

  const clientesConPuntuacion = clientes.map(cliente => {
    const totalPagado = cliente.abonos.reduce((sum, abono) => sum + abono.monto, 0);
    const notasPagadas = cliente.notasCredito.length;
    const promedioDiasPago = cliente.notasCredito.length > 0 
      ? cliente.notasCredito.reduce((sum, nota) => {
          const fechaVenta = new Date(nota.fechaVenta);
          const fechaPago = new Date(nota.fechaModificacion);
          return sum + Math.floor((fechaPago - fechaVenta) / (1000 * 60 * 60 * 24));
        }, 0) / cliente.notasCredito.length
      : 0;

    return {
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
      telefono: cliente.telefono,
      ruta: cliente.ruta?.nombre || 'Sin ruta',
      totalPagado,
      notasPagadas,
      promedioDiasPago: Math.round(promedioDiasPago),
      limiteCredito: cliente.limiteCredito,
      saldoActual: cliente.saldoActual
    };
  });

  return clientesConPuntuacion
    .sort((a, b) => b.totalPagado - a.totalPagado)
    .slice(0, limite);
};

// Top 10 Peores Pagadores
exports.getTopPeoresPagadores = async (limite = 10) => {
  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCliente: 'activo'
    },
    include: {
      notasCredito: {
        where: {
          estado: {
            in: ['vencida', 'por_vencer']
          }
        }
      },
      ruta: {
        select: {
          nombre: true
        }
      }
    }
  });

  const clientesConProblemas = clientes
    .map(cliente => {
      const totalVencido = cliente.notasCredito
        .filter(nota => nota.estado === 'vencida')
        .reduce((sum, nota) => sum + nota.saldoPendiente, 0);
      
      const totalPorVencer = cliente.notasCredito
        .filter(nota => nota.estado === 'por_vencer')
        .reduce((sum, nota) => sum + nota.saldoPendiente, 0);

      const diasPromedioVencimiento = cliente.notasCredito.length > 0
        ? cliente.notasCredito.reduce((sum, nota) => {
            const hoy = new Date();
            const fechaVencimiento = new Date(nota.fechaVencimiento);
            return sum + Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
          }, 0) / cliente.notasCredito.length
        : 0;

      return {
        id: cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
        telefono: cliente.telefono,
        ruta: cliente.ruta?.nombre || 'Sin ruta',
        totalVencido,
        totalPorVencer,
        cantidadNotasVencidas: cliente.notasCredito.filter(n => n.estado === 'vencida').length,
        diasPromedioVencimiento: Math.round(diasPromedioVencimiento),
        limiteCredito: cliente.limiteCredito,
        saldoActual: cliente.saldoActual
      };
    })
    .filter(cliente => cliente.totalVencido > 0 || cliente.totalPorVencer > 0)
    .sort((a, b) => (b.totalVencido + b.totalPorVencer) - (a.totalVencido + a.totalPorVencer))
    .slice(0, limite);

  return clientesConProblemas;
};

// Análisis de Riesgo
exports.getAnalisisRiesgo = async () => {
  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCliente: 'activo'
    },
    include: {
      notasCredito: true,
      abonos: true,
      ruta: {
        select: {
          nombre: true
        }
      }
    }
  });

  const analisis = {
    bajo: [],
    medio: [],
    alto: [],
    critico: []
  };

  clientes.forEach(cliente => {
    const saldoActual = cliente.saldoActual;
    const limiteCredito = cliente.limiteCredito;
    const porcentajeUso = limiteCredito > 0 ? (saldoActual / limiteCredito) * 100 : 0;
    
    const notasVencidas = cliente.notasCredito.filter(n => n.estado === 'vencida').length;
    const totalVencido = cliente.notasCredito
      .filter(n => n.estado === 'vencida')
      .reduce((sum, n) => sum + n.saldoPendiente, 0);

    const diasPromedioVencimiento = cliente.notasCredito.length > 0
      ? cliente.notasCredito.reduce((sum, nota) => {
          const hoy = new Date();
          const fechaVencimiento = new Date(nota.fechaVencimiento);
          return sum + Math.max(0, Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24)));
        }, 0) / cliente.notasCredito.length
      : 0;

    const item = {
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
      telefono: cliente.telefono,
      ruta: cliente.ruta?.nombre || 'Sin ruta',
      limiteCredito,
      saldoActual,
      porcentajeUso: Math.round(porcentajeUso),
      notasVencidas,
      totalVencido,
      diasPromedioVencimiento: Math.round(diasPromedioVencimiento)
    };

    // Clasificación de riesgo
    if (porcentajeUso > 100 || totalVencido > limiteCredito * 0.5 || diasPromedioVencimiento > 90) {
      analisis.critico.push(item);
    } else if (porcentajeUso > 80 || totalVencido > limiteCredito * 0.3 || diasPromedioVencimiento > 60) {
      analisis.alto.push(item);
    } else if (porcentajeUso > 50 || totalVencido > 0 || diasPromedioVencimiento > 30) {
      analisis.medio.push(item);
    } else {
      analisis.bajo.push(item);
    }
  });

  return analisis;
};

// Clientes para Visita de Cobranza (por Ruta)
exports.getClientesVisitaCobranza = async (rutaId = null) => {
  const where = {
    estadoCliente: 'activo',
    notasCredito: {
      some: {
        estado: {
          in: ['vencida', 'por_vencer']
        }
      }
    }
  };

  if (rutaId) {
    where.rutaId = rutaId;
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      notasCredito: {
        where: {
          estado: {
            in: ['vencida', 'por_vencer']
          }
        }
      },
      ruta: {
        select: {
          id: true,
          nombre: true
        }
      },
      zona: {
        select: {
          nombre: true
        }
      }
    }
  });

  return clientes.map(cliente => {
    const totalVencido = cliente.notasCredito
      .filter(n => n.estado === 'vencida')
      .reduce((sum, n) => sum + n.saldoPendiente, 0);
    
    const totalPorVencer = cliente.notasCredito
      .filter(n => n.estado === 'por_vencer')
      .reduce((sum, n) => sum + n.saldoPendiente, 0);

    const ultimaVisita = null; // Se puede agregar un campo de historial de visitas

    return {
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
      telefono: cliente.telefono,
      calle: cliente.calle,
      numeroExterior: cliente.numeroExterior,
      colonia: cliente.colonia,
      ruta: cliente.ruta?.nombre || 'Sin ruta',
      rutaId: cliente.rutaId,
      zona: cliente.zona?.nombre || 'Sin zona',
      totalVencido,
      totalPorVencer,
      cantidadNotas: cliente.notasCredito.length,
      ultimaVisita
    };
  }).sort((a, b) => (b.totalVencido + b.totalPorVencer) - (a.totalVencido + a.totalPorVencer));
};

// Recordatorios por Enviar
exports.getRecordatoriosPorEnviar = async () => {
  const hoy = new Date();
  const en3Dias = new Date();
  en3Dias.setDate(hoy.getDate() + 3);

  const notasPorVencer = await prisma.notaCredito.findMany({
    where: {
      estado: {
        in: ['vigente', 'por_vencer']
      },
      fechaVencimiento: {
        lte: en3Dias,
        gte: hoy
      }
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          email: true,
          telefono: true
        }
      }
    }
  });

  return notasPorVencer.map(nota => {
    const diasParaVencer = Math.ceil((new Date(nota.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24));
    
    return {
      id: nota.id,
      numeroNota: nota.numeroNota,
      cliente: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno || ''}`.trim(),
      email: nota.cliente.email,
      telefono: nota.cliente.telefono,
      fechaVencimiento: nota.fechaVencimiento,
      diasParaVencer,
      importe: nota.importe,
      saldoPendiente: nota.saldoPendiente,
      enviado: false // Se puede agregar un campo para trackear si ya se envió
    };
  }).sort((a, b) => a.diasParaVencer - b.diasParaVencer);
};

// Transferencias Pendientes Confirmación
exports.getTransferenciasPendientes = async () => {
  const pagos = await prisma.pago.findMany({
    where: {
      estado: 'pendiente',
      formasPago: {
        some: {
          formaPago: {
            tipo: 'transferencia'
          }
        }
      }
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true
        }
      },
      formasPago: {
        include: {
          formaPago: {
            select: {
              nombre: true,
              tipo: true
            }
          }
        }
      },
      notaCredito: {
        select: {
          numeroNota: true
        }
      }
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  return pagos.map(pago => {
    const transferencias = pago.formasPago.filter(pfp => pfp.formaPago.tipo === 'transferencia');
    
    return {
      id: pago.id,
      cliente: `${pago.cliente.nombre} ${pago.cliente.apellidoPaterno} ${pago.cliente.apellidoMaterno || ''}`.trim(),
      telefono: pago.cliente.telefono,
      notaCredito: pago.notaCredito?.numeroNota || 'Abono General',
      montoTotal: pago.montoTotal,
      transferencias: transferencias.map(t => ({
        monto: t.monto,
        referencia: t.referencia,
        banco: t.banco,
        formaPago: t.formaPago.nombre
      })),
      fechaPago: pago.fechaPago,
      fechaCreacion: pago.fechaCreacion,
      usuarioRegistro: pago.usuarioRegistro
    };
  });
};

// Clientes con Límite Excedido
exports.getClientesLimiteExcedido = async () => {
  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCliente: 'activo'
    },
    include: {
      notasCredito: {
        where: {
          estado: {
            in: ['vigente', 'por_vencer', 'vencida']
          }
        }
      },
      ruta: {
        select: {
          nombre: true
        }
      }
    }
  });

  return clientes
    .filter(cliente => cliente.saldoActual > cliente.limiteCredito)
    .map(cliente => {
      const exceso = cliente.saldoActual - cliente.limiteCredito;
      const porcentajeExceso = cliente.limiteCredito > 0 
        ? ((exceso / cliente.limiteCredito) * 100).toFixed(2)
        : 0;

      return {
        id: cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
        telefono: cliente.telefono,
        ruta: cliente.ruta?.nombre || 'Sin ruta',
        limiteCredito: cliente.limiteCredito,
        saldoActual: cliente.saldoActual,
        exceso,
        porcentajeExceso: parseFloat(porcentajeExceso),
        cantidadNotas: cliente.notasCredito.length,
        totalNotas: cliente.notasCredito.reduce((sum, n) => sum + n.saldoPendiente, 0)
      };
    })
    .sort((a, b) => b.exceso - a.exceso);
};

// Comparativo Cartera vs Ventas
exports.getComparativoCarteraVentas = async (fechaDesde, fechaHasta) => {
  const wherePedidos = {
    estado: 'entregado'
  };

  if (fechaDesde) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      lte: new Date(fechaHasta)
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      fechaPedido: true,
      ventaTotal: true,
      montoPagado: true
    }
  });

  const notasCredito = await prisma.notaCredito.findMany({
    where: {
      estado: {
        in: ['vigente', 'por_vencer', 'vencida']
      }
    },
    select: {
      fechaVenta: true,
      importe: true,
      saldoPendiente: true
    }
  });

  const totalVentas = pedidos.reduce((sum, p) => sum + p.ventaTotal, 0);
  const totalPagado = pedidos.reduce((sum, p) => sum + (p.montoPagado || 0), 0);
  const totalCartera = notasCredito.reduce((sum, n) => sum + n.saldoPendiente, 0);
  const totalCarteraVigente = notasCredito.reduce((sum, n) => sum + n.importe, 0);

  return {
    periodo: {
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null
    },
    ventas: {
      total: totalVentas,
      pagado: totalPagado,
      pendiente: totalVentas - totalPagado
    },
    cartera: {
      total: totalCartera,
      vigente: totalCarteraVigente,
      porcentajeSobreVentas: totalVentas > 0 ? ((totalCartera / totalVentas) * 100).toFixed(2) : 0
    },
    indicadores: {
      ratioCobranza: totalVentas > 0 ? ((totalPagado / totalVentas) * 100).toFixed(2) : 0,
      diasPromedioCartera: 0 // Se puede calcular basado en fechas
    }
  };
};

// Eficiencia de Cobranza por Repartidor
exports.getEficienciaCobranzaRepartidor = async (fechaDesde, fechaHasta) => {
  const where = {};

  if (fechaDesde) {
    where.fechaCreacion = {
      ...where.fechaCreacion,
      gte: new Date(fechaDesde)
    };
  }

  if (fechaHasta) {
    where.fechaCreacion = {
      ...where.fechaCreacion,
      lte: new Date(fechaHasta)
    };
  }

  const repartidores = await prisma.usuario.findMany({
    where: {
      rol: 'repartidor',
      estado: 'activo'
    },
    include: {
      pedidos: {
        where: {
          estado: 'entregado',
          ...where
        },
        include: {
          cliente: {
            include: {
              notasCredito: {
                where: {
                  estado: {
                    in: ['vigente', 'por_vencer', 'vencida']
                  }
                }
              },
              abonos: {
                where
              }
            }
          }
        }
      }
    }
  });

  return repartidores.map(repartidor => {
    const clientes = repartidor.pedidos.map(p => p.cliente);
    const clientesUnicos = [...new Map(clientes.map(c => [c.id, c])).values()];

    const totalVentas = repartidor.pedidos.reduce((sum, p) => sum + p.ventaTotal, 0);
    const totalCartera = clientesUnicos.reduce((sum, c) => {
      return sum + c.notasCredito.reduce((s, n) => s + n.saldoPendiente, 0);
    }, 0);
    const totalCobrado = clientesUnicos.reduce((sum, c) => {
      return sum + c.abonos.reduce((s, a) => s + a.monto, 0);
    }, 0);

    const eficiencia = totalVentas > 0 ? ((totalCobrado / totalVentas) * 100).toFixed(2) : 0;

    return {
      id: repartidor.id,
      nombre: `${repartidor.nombres} ${repartidor.apellidoPaterno} ${repartidor.apellidoMaterno || ''}`.trim(),
      totalVentas,
      totalCartera,
      totalCobrado,
      eficiencia: parseFloat(eficiencia),
      cantidadClientes: clientesUnicos.length,
      cantidadPedidos: repartidor.pedidos.length
    };
  }).sort((a, b) => b.eficiencia - a.eficiencia);
};

// Análisis de Tendencias de Pago
exports.getTendenciasPago = async (meses = 12) => {
  const hoy = new Date();
  const fechaInicio = new Date();
  fechaInicio.setMonth(hoy.getMonth() - meses);

  const abonos = await prisma.abonoCliente.findMany({
    where: {
      fecha: {
        gte: fechaInicio
      }
    },
    select: {
      fecha: true,
      monto: true,
      formaPago: {
        select: {
          tipo: true,
          nombre: true
        }
      }
    }
  });

  const tendencias = {};
  
  abonos.forEach(abono => {
    const fecha = new Date(abono.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    
    if (!tendencias[mes]) {
      tendencias[mes] = {
        mes,
        mesNombre,
        total: 0,
        porFormaPago: {}
      };
    }
    
    tendencias[mes].total += abono.monto;
    const tipoPago = abono.formaPago.tipo;
    if (!tendencias[mes].porFormaPago[tipoPago]) {
      tendencias[mes].porFormaPago[tipoPago] = 0;
    }
    tendencias[mes].porFormaPago[tipoPago] += abono.monto;
  });

  return Object.values(tendencias).sort((a, b) => a.mes.localeCompare(b.mes));
};

// Proyección de Flujo de Caja
exports.getProyeccionFlujoCaja = async (meses = 6) => {
  const hoy = new Date();
  const proyeccion = [];

  // Obtener notas de crédito vigentes
  const notasCredito = await prisma.notaCredito.findMany({
    where: {
      estado: {
        in: ['vigente', 'por_vencer']
      }
    },
    select: {
      fechaVencimiento: true,
      saldoPendiente: true
    }
  });

  // Obtener abonos históricos para calcular promedio
  const fechaInicio = new Date();
  fechaInicio.setMonth(hoy.getMonth() - 6);
  
  const abonosHistoricos = await prisma.abonoCliente.findMany({
    where: {
      fecha: {
        gte: fechaInicio
      }
    },
    select: {
      fecha: true,
      monto: true
    }
  });

  const promedioMensual = abonosHistoricos.length > 0
    ? abonosHistoricos.reduce((sum, a) => sum + a.monto, 0) / 6
    : 0;

  // Proyectar mes a mes
  for (let i = 0; i < meses; i++) {
    const fechaProyeccion = new Date();
    fechaProyeccion.setMonth(hoy.getMonth() + i);
    const mes = `${fechaProyeccion.getFullYear()}-${String(fechaProyeccion.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fechaProyeccion.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

    // Calcular vencimientos esperados en este mes
    const vencimientosEsperados = notasCredito
      .filter(n => {
        const fechaVenc = new Date(n.fechaVencimiento);
        return fechaVenc.getFullYear() === fechaProyeccion.getFullYear() &&
               fechaVenc.getMonth() === fechaProyeccion.getMonth();
      })
      .reduce((sum, n) => sum + n.saldoPendiente, 0);

    proyeccion.push({
      mes,
      mesNombre,
      vencimientosEsperados,
      cobranzaProyectada: promedioMensual,
      diferencia: promedioMensual - vencimientosEsperados
    });
  }

  return proyeccion;
};

