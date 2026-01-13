const { prisma } = require('../config/database');

// Antigüedad de cartera
exports.getAntiguedadCartera = async (sedeId) => {
  const where = {
    estado: {
      in: ['vigente', 'por_vencer', 'vencida'],
    },
  };

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          ruta: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  });

  const hoy = new Date();
  const antiguedad = {
    '0-30': [],
    '31-60': [],
    '61-90': [],
    '90+': [],
  };

  notasCredito.forEach((nota) => {
    const diasVencimiento = nota.diasVencimiento || 0;
    const saldo = parseFloat(nota.saldoPendiente) || 0;

    if (diasVencimiento <= 30) {
      antiguedad['0-30'].push({
        ...nota,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        saldo,
      });
    } else if (diasVencimiento <= 60) {
      antiguedad['31-60'].push({
        ...nota,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        saldo,
      });
    } else if (diasVencimiento <= 90) {
      antiguedad['61-90'].push({
        ...nota,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        saldo,
      });
    } else {
      antiguedad['90+'].push({
        ...nota,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        saldo,
      });
    }
  });

  return antiguedad;
};

// Top mejores pagadores
exports.getTopMejoresPagadores = async (limite = 10, sedeId) => {
  const where = {};

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const pagos = await prisma.pago.findMany({
    where: {
      estado: 'autorizado',
      ...where,
    },
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          ruta: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      montoTotal: 'desc',
    },
    take: limite,
  });

  return pagos.map((pago) => ({
    clienteId: pago.clienteId,
    clienteNombre: `${pago.cliente.nombre} ${pago.cliente.apellidoPaterno} ${pago.cliente.apellidoMaterno}`,
    telefono: pago.cliente.telefono,
    ruta: pago.cliente.ruta?.nombre || 'Sin ruta',
    montoTotal: parseFloat(pago.montoTotal) || 0,
    fechaPago: pago.fechaPago,
  }));
};

// Top peores pagadores
exports.getTopPeoresPagadores = async (limite = 10, sedeId) => {
  const where = {
    estado: {
      in: ['vigente', 'vencida'],
    },
  };

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          ruta: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      diasVencimiento: 'desc',
    },
  });

  // Agrupar por cliente y sumar saldos
  const clientesMap = {};
  notasCredito.forEach((nota) => {
    const clienteId = nota.clienteId;
    if (!clientesMap[clienteId]) {
      clientesMap[clienteId] = {
        clienteId,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        telefono: nota.cliente.telefono,
        ruta: nota.cliente.ruta?.nombre || 'Sin ruta',
        saldoTotal: 0,
        diasVencimiento: 0,
        cantidadNotas: 0,
      };
    }
    clientesMap[clienteId].saldoTotal += parseFloat(nota.saldoPendiente) || 0;
    clientesMap[clienteId].diasVencimiento = Math.max(
      clientesMap[clienteId].diasVencimiento,
      nota.diasVencimiento || 0
    );
    clientesMap[clienteId].cantidadNotas += 1;
  });

  return Object.values(clientesMap)
    .sort((a, b) => b.saldoTotal - a.saldoTotal)
    .slice(0, limite);
};

// Análisis de riesgo
exports.getAnalisisRiesgo = async (sedeId) => {
  const where = {};

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where: {
      estado: {
        in: ['vigente', 'por_vencer', 'vencida'],
      },
      ...where,
    },
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          limiteCredito: true,
          saldoActual: true,
          ruta: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  });

  const analisis = {
    bajo: [],
    medio: [],
    alto: [],
    critico: [],
  };

  notasCredito.forEach((nota) => {
    const saldo = parseFloat(nota.saldoPendiente) || 0;
    const limiteCredito = parseFloat(nota.cliente.limiteCredito) || 0;
    const porcentajeUso = limiteCredito > 0 ? (saldo / limiteCredito) * 100 : 0;
    const diasVencimiento = nota.diasVencimiento || 0;

    const item = {
      clienteId: nota.clienteId,
      clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
      ruta: nota.cliente.ruta?.nombre || 'Sin ruta',
      saldo,
      limiteCredito,
      porcentajeUso,
      diasVencimiento,
      estado: nota.estado,
    };

    if (diasVencimiento > 90 || porcentajeUso > 100) {
      analisis.critico.push(item);
    } else if (diasVencimiento > 60 || porcentajeUso > 80) {
      analisis.alto.push(item);
    } else if (diasVencimiento > 30 || porcentajeUso > 50) {
      analisis.medio.push(item);
    } else {
      analisis.bajo.push(item);
    }
  });

  return analisis;
};

// Clientes para visita de cobranza
exports.getClientesParaVisitaCobranza = async (rutaId, sedeId) => {
  const where = {
    estado: {
      in: ['vencida', 'por_vencer'],
    },
  };

  if (rutaId) {
    where.cliente = {
      rutaId: rutaId,
    };
  } else if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          telefono: true,
          calle: true,
          numeroExterior: true,
          colonia: true,
          municipio: true,
          estado: true,
          ruta: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      diasVencimiento: 'desc',
    },
  });

  // Agrupar por cliente
  const clientesMap = {};
  notasCredito.forEach((nota) => {
    const clienteId = nota.clienteId;
    if (!clientesMap[clienteId]) {
      clientesMap[clienteId] = {
        clienteId,
        clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
        telefono: nota.cliente.telefono,
        direccion: `${nota.cliente.calle} ${nota.cliente.numeroExterior}, ${nota.cliente.colonia}, ${nota.cliente.municipio}, ${nota.cliente.estado}`,
        rutaId: nota.cliente.ruta?.id,
        rutaNombre: nota.cliente.ruta?.nombre || 'Sin ruta',
        saldoTotal: 0,
        diasVencimiento: 0,
        cantidadNotas: 0,
      };
    }
    clientesMap[clienteId].saldoTotal += parseFloat(nota.saldoPendiente) || 0;
    clientesMap[clienteId].diasVencimiento = Math.max(
      clientesMap[clienteId].diasVencimiento,
      nota.diasVencimiento || 0
    );
    clientesMap[clienteId].cantidadNotas += 1;
  });

  return Object.values(clientesMap).sort((a, b) => b.diasVencimiento - a.diasVencimiento);
};

// Recordatorios por enviar
exports.getRecordatoriosPorEnviar = async (sedeId) => {
  const where = {
    estado: {
      in: ['por_vencer', 'vencida'],
    },
  };

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const notasCredito = await prisma.notaCredito.findMany({
    where,
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          email: true,
          telefono: true,
        },
      },
    },
  });

  return notasCredito.map((nota) => ({
    notaCreditoId: nota.id,
    numeroNota: nota.numeroNota,
    clienteNombre: `${nota.cliente.nombre} ${nota.cliente.apellidoPaterno} ${nota.cliente.apellidoMaterno}`,
    email: nota.cliente.email,
    telefono: nota.cliente.telefono,
    saldo: parseFloat(nota.saldoPendiente) || 0,
    fechaVencimiento: nota.fechaVencimiento,
    diasVencimiento: nota.diasVencimiento || 0,
    estado: nota.estado,
  }));
};

// Transferencias pendientes de confirmación
exports.getTransferenciasPendientesConfirmacion = async (sedeId) => {
  const where = {
    estado: 'pendiente',
    formasPago: {
      some: {
        formaPago: {
          tipo: 'transferencia',
        },
      },
    },
  };

  if (sedeId) {
    where.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const pagos = await prisma.pago.findMany({
    where,
    include: {
      cliente: {
        select: {
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
        },
      },
      formasPago: {
        include: {
          formaPago: {
            select: {
              nombre: true,
              tipo: true,
            },
          },
        },
      },
    },
    orderBy: {
      fechaPago: 'desc',
    },
  });

  return pagos.map((pago) => ({
    pagoId: pago.id,
    clienteNombre: `${pago.cliente.nombre} ${pago.cliente.apellidoPaterno} ${pago.cliente.apellidoMaterno}`,
    montoTotal: parseFloat(pago.montoTotal) || 0,
    fechaPago: pago.fechaPago,
    formasPago: pago.formasPago.map((fp) => ({
      formaPago: fp.formaPago.nombre,
      monto: parseFloat(fp.monto) || 0,
      referencia: fp.referencia,
      banco: fp.banco,
    })),
  }));
};

// Clientes con límite excedido
exports.getClientesConLimiteExcedido = async (sedeId) => {
  const where = {};

  if (sedeId) {
    where.ruta = {
      sedeId: sedeId,
    };
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      notasCredito: {
        where: {
          estado: {
            in: ['vigente', 'por_vencer', 'vencida'],
          },
        },
      },
      ruta: {
        select: {
          nombre: true,
        },
      },
    },
  });

  const clientesExcedidos = [];

  clientes.forEach((cliente) => {
    const limiteCredito = parseFloat(cliente.limiteCredito) || 0;
    const saldoActual = parseFloat(cliente.saldoActual) || 0;

    if (saldoActual > limiteCredito) {
      const saldoNotas = cliente.notasCredito.reduce(
        (sum, nota) => sum + (parseFloat(nota.saldoPendiente) || 0),
        0
      );

      clientesExcedidos.push({
        clienteId: cliente.id,
        clienteNombre: `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`,
        telefono: cliente.telefono,
        ruta: cliente.ruta?.nombre || 'Sin ruta',
        limiteCredito,
        saldoActual,
        saldoNotas,
        exceso: saldoActual - limiteCredito,
        porcentajeExceso: limiteCredito > 0 ? ((saldoActual - limiteCredito) / limiteCredito) * 100 : 0,
      });
    }
  });

  return clientesExcedidos.sort((a, b) => b.exceso - a.exceso);
};

// Comparativo cartera vs ventas
exports.getComparativoCarteraVentas = async (fechaDesde, fechaHasta, sedeId) => {
  const wherePedidos = {
    estado: 'entregado',
  };
  const whereNotas = {};

  if (fechaDesde) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      gte: new Date(fechaDesde),
    };
    whereNotas.fechaVenta = {
      ...whereNotas.fechaVenta,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    wherePedidos.fechaPedido = {
      ...wherePedidos.fechaPedido,
      lte: new Date(fechaHasta),
    };
    whereNotas.fechaVenta = {
      ...whereNotas.fechaVenta,
      lte: new Date(fechaHasta),
    };
  }
  if (sedeId) {
    wherePedidos.sedeId = sedeId;
    whereNotas.cliente = {
      ruta: {
        sedeId: sedeId,
      },
    };
  }

  const pedidos = await prisma.pedido.findMany({
    where: wherePedidos,
    select: {
      ventaTotal: true,
      fechaPedido: true,
    },
  });

  const notasCredito = await prisma.notaCredito.findMany({
    where: whereNotas,
    select: {
      importe: true,
      saldoPendiente: true,
      fechaVenta: true,
    },
  });

  const totalVentas = pedidos.reduce((sum, p) => sum + (parseFloat(p.ventaTotal) || 0), 0);
  const totalCartera = notasCredito.reduce((sum, n) => sum + (parseFloat(n.importe) || 0), 0);
  const carteraPendiente = notasCredito.reduce((sum, n) => sum + (parseFloat(n.saldoPendiente) || 0), 0);
  const carteraPagada = totalCartera - carteraPendiente;

  return {
    totalVentas,
    totalCartera,
    carteraPendiente,
    carteraPagada,
    porcentajeCobrado: totalCartera > 0 ? (carteraPagada / totalCartera) * 100 : 0,
    porcentajePendiente: totalCartera > 0 ? (carteraPendiente / totalCartera) * 100 : 0,
  };
};

// Eficiencia de cobranza por repartidor
exports.getEficienciaCobranzaPorRepartidor = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {
    estado: 'autorizado',
  };

  if (fechaDesde) {
    where.fechaPago = {
      ...where.fechaPago,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaPago = {
      ...where.fechaPago,
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

  const pagos = await prisma.pago.findMany({
    where,
    include: {
      cliente: {
        select: {
          ruta: {
            select: {
              repartidores: {
                select: {
                  usuario: {
                    select: {
                      id: true,
                      nombres: true,
                      apellidoPaterno: true,
                      apellidoMaterno: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const repartidoresMap = {};

  pagos.forEach((pago) => {
    const repartidores = pago.cliente.ruta?.repartidores || [];
    repartidores.forEach((ur) => {
      const repartidorId = ur.usuario.id;
      if (!repartidoresMap[repartidorId]) {
        repartidoresMap[repartidorId] = {
          repartidorId,
          repartidorNombre: `${ur.usuario.nombres} ${ur.usuario.apellidoPaterno} ${ur.usuario.apellidoMaterno}`,
          cantidadPagos: 0,
          montoTotal: 0,
        };
      }
      repartidoresMap[repartidorId].cantidadPagos += 1;
      repartidoresMap[repartidorId].montoTotal += parseFloat(pago.montoTotal) || 0;
    });
  });

  return Object.values(repartidoresMap).sort((a, b) => b.montoTotal - a.montoTotal);
};

// Análisis de tendencias de pago
exports.getAnalisisTendenciasPago = async (fechaDesde, fechaHasta, sedeId) => {
  const where = {
    estado: 'autorizado',
  };

  if (fechaDesde) {
    where.fechaPago = {
      ...where.fechaPago,
      gte: new Date(fechaDesde),
    };
  }
  if (fechaHasta) {
    where.fechaPago = {
      ...where.fechaPago,
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

  const pagos = await prisma.pago.findMany({
    where,
    select: {
      fechaPago: true,
      montoTotal: true,
    },
  });

  // Agrupar por mes
  const tendenciasPorMes = {};
  pagos.forEach((pago) => {
    const fecha = new Date(pago.fechaPago);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    if (!tendenciasPorMes[mes]) {
      tendenciasPorMes[mes] = {
        mes: nombreMes,
        cantidadPagos: 0,
        montoTotal: 0,
      };
    }
    tendenciasPorMes[mes].cantidadPagos += 1;
    tendenciasPorMes[mes].montoTotal += parseFloat(pago.montoTotal) || 0;
  });

  return Object.values(tendenciasPorMes).sort((a, b) => {
    const fechaA = new Date(a.mes);
    const fechaB = new Date(b.mes);
    return fechaA - fechaB;
  });
};

// Proyección de flujo de caja
exports.getProyeccionFlujoCaja = async (sedeId) => {
  const hoy = new Date();
  const proximos30Dias = new Date();
  proximos30Dias.setDate(hoy.getDate() + 30);

  const where = {
    estado: {
      in: ['vigente', 'por_vencer'],
    },
    fechaVencimiento: {
      lte: proximos30Dias,
      gte: hoy,
    },
  };

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
      fechaVencimiento: true,
      saldoPendiente: true,
    },
  });

  // Agrupar por semana
  const proyeccionPorSemana = {};
  notasCredito.forEach((nota) => {
    const fechaVenc = new Date(nota.fechaVencimiento);
    const semana = `Semana ${Math.ceil((fechaVenc.getDate() - hoy.getDate()) / 7)}`;
    
    if (!proyeccionPorSemana[semana]) {
      proyeccionPorSemana[semana] = {
        semana,
        montoEsperado: 0,
        cantidadNotas: 0,
      };
    }
    proyeccionPorSemana[semana].montoEsperado += parseFloat(nota.saldoPendiente) || 0;
    proyeccionPorSemana[semana].cantidadNotas += 1;
  });

  return Object.values(proyeccionPorSemana);
};

