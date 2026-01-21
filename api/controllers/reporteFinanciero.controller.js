const reporteFinancieroService = require('../../services/reporteFinanciero.service');

exports.getAntiguedadCartera = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const antiguedad = await reporteFinancieroService.getAntiguedadCartera(sedeId);
    res.json(antiguedad);
  } catch (error) {
    console.error('Error al obtener antigüedad de cartera:', error);
    res.status(500).json({ message: 'Error al obtener antigüedad de cartera', error: error.message });
  }
};

exports.getTopMejoresPagadores = async (req, res) => {
  try {
    const { limite = 10, sedeId } = req.query;
    const mejores = await reporteFinancieroService.getTopMejoresPagadores(parseInt(limite), sedeId);
    res.json(mejores);
  } catch (error) {
    console.error('Error al obtener top mejores pagadores:', error);
    res.status(500).json({ message: 'Error al obtener top mejores pagadores', error: error.message });
  }
};

exports.getTopPeoresPagadores = async (req, res) => {
  try {
    const { limite = 10, sedeId } = req.query;
    const peores = await reporteFinancieroService.getTopPeoresPagadores(parseInt(limite), sedeId);
    res.json(peores);
  } catch (error) {
    console.error('Error al obtener top peores pagadores:', error);
    res.status(500).json({ message: 'Error al obtener top peores pagadores', error: error.message });
  }
};

exports.getAnalisisRiesgo = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const analisis = await reporteFinancieroService.getAnalisisRiesgo(sedeId);
    res.json(analisis);
  } catch (error) {
    console.error('Error al obtener análisis de riesgo:', error);
    res.status(500).json({ message: 'Error al obtener análisis de riesgo', error: error.message });
  }
};

exports.getClientesParaVisitaCobranza = async (req, res) => {
  try {
    const { rutaId, sedeId } = req.query;
    const clientes = await reporteFinancieroService.getClientesParaVisitaCobranza(rutaId, sedeId);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes para visita de cobranza:', error);
    res.status(500).json({ message: 'Error al obtener clientes para visita de cobranza', error: error.message });
  }
};

exports.getRecordatoriosPorEnviar = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const recordatorios = await reporteFinancieroService.getRecordatoriosPorEnviar(sedeId);
    res.json(recordatorios);
  } catch (error) {
    console.error('Error al obtener recordatorios por enviar:', error);
    res.status(500).json({ message: 'Error al obtener recordatorios por enviar', error: error.message });
  }
};

exports.getTransferenciasPendientesConfirmacion = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const transferencias = await reporteFinancieroService.getTransferenciasPendientesConfirmacion(sedeId);
    res.json(transferencias);
  } catch (error) {
    console.error('Error al obtener transferencias pendientes:', error);
    res.status(500).json({ message: 'Error al obtener transferencias pendientes', error: error.message });
  }
};

exports.getClientesConLimiteExcedido = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const clientes = await reporteFinancieroService.getClientesConLimiteExcedido(sedeId);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes con límite excedido:', error);
    res.status(500).json({ message: 'Error al obtener clientes con límite excedido', error: error.message });
  }
};

exports.getComparativoCarteraVentas = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const comparativo = await reporteFinancieroService.getComparativoCarteraVentas(fechaDesde, fechaHasta, sedeId);
    res.json(comparativo);
  } catch (error) {
    console.error('Error al obtener comparativo cartera vs ventas:', error);
    res.status(500).json({ message: 'Error al obtener comparativo cartera vs ventas', error: error.message });
  }
};

exports.getEficienciaCobranzaPorRepartidor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const eficiencia = await reporteFinancieroService.getEficienciaCobranzaPorRepartidor(fechaDesde, fechaHasta, sedeId);
    res.json(eficiencia);
  } catch (error) {
    console.error('Error al obtener eficiencia de cobranza:', error);
    res.status(500).json({ message: 'Error al obtener eficiencia de cobranza', error: error.message });
  }
};

exports.getAnalisisTendenciasPago = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, sedeId } = req.query;
    const tendencias = await reporteFinancieroService.getAnalisisTendenciasPago(fechaDesde, fechaHasta, sedeId);
    res.json(tendencias);
  } catch (error) {
    console.error('Error al obtener análisis de tendencias de pago:', error);
    res.status(500).json({ message: 'Error al obtener análisis de tendencias de pago', error: error.message });
  }
};

exports.getProyeccionFlujoCaja = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const proyeccion = await reporteFinancieroService.getProyeccionFlujoCaja(sedeId);
    res.json(proyeccion);
  } catch (error) {
    console.error('Error al obtener proyección de flujo de caja:', error);
    res.status(500).json({ message: 'Error al obtener proyección de flujo de caja', error: error.message });
  }
};


