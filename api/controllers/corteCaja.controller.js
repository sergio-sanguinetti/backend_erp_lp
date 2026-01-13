const corteCajaService = require('../../services/corteCaja.service');

exports.getTodaySummary = async (req, res) => {
  try {
    const summary = await corteCajaService.getTodaySummary(req.user.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkCorte = async (req, res) => {
  try {
    const { tipo } = req.query;
    if (!tipo) return res.status(400).json({ message: 'El tipo de corte es requerido' });
    
    const corte = await corteCajaService.checkExistingCorte(req.user.id, tipo);
    res.json({ exists: !!corte, corte });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCorte = async (req, res) => {
  try {
    const corteData = {
      ...req.body,
      repartidorId: req.user.id
    };
    const corte = await corteCajaService.createCorte(corteData);
    res.status(201).json(corte);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCortes = async (req, res) => {
  try {
    const cortes = await corteCajaService.getAllCortes();
    res.json(cortes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCortePipas = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const resumen = await corteCajaService.getCorteResumenPorTipoServicio('pipas', sedeId);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCorteCilindros = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const resumen = await corteCajaService.getCorteResumenPorTipoServicio('cilindros', sedeId);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateCorte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, validaciones } = req.body;
    
    const corte = await corteCajaService.validateCorte(id, {
      estado,
      observaciones,
      validaciones
    });
    
    res.json(corte);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};










