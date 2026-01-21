const express = require('express');
const router = express.Router();
const configuracionTicketController = require('../controllers/configuracionTicket.controller');
const { protect } = require('../middlewares/auth.middleware');

// Log para depuración
console.log('ConfiguracionTicket routes cargadas');

// Middleware de logging para todas las peticiones
router.use((req, res, next) => {
  console.log(`[ConfiguracionTicket] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body ? Object.keys(req.body) : 'no body',
    headers: req.headers.authorization ? 'has auth' : 'no auth'
  });
  next();
});

// Ruta de prueba para verificar que la ruta funciona
router.get('/test', (req, res) => {
  res.json({ message: 'Ruta de configuracion-tickets funcionando correctamente', path: req.path, method: req.method });
});

// Ruta PUT debe estar ANTES de las rutas GET para evitar conflictos
// TEMPORALMENTE SIN PROTECCIÓN PARA DEBUG
router.put('/', (req, res, next) => {
  console.log('[PUT /] Petición recibida directamente, llamando al controlador...');
  console.log('[PUT /] Body recibido:', req.body);
  configuracionTicketController.updateConfiguracionTicket(req, res, next);
});

// Ruta pública (para obtener todas las configuraciones de tickets)
router.get('/all', configuracionTicketController.getAllConfiguracionesTicket);

// Ruta pública (para obtener la configuración de tickets por tipo - la app móvil necesita acceso)
router.get('/', configuracionTicketController.getConfiguracionTicket);

module.exports = router;

