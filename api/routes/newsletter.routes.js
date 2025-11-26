// routes/newsletter.routes.js

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas (para obtener items activos)
router.get('/', newsletterController.getAllNewsletterItems);
router.get('/:id', newsletterController.getNewsletterItemById);

// Rutas protegidas (para crear, actualizar y eliminar)
router.post('/', protect, newsletterController.createNewsletterItem);
router.put('/:id', protect, newsletterController.updateNewsletterItem);
router.delete('/:id', protect, newsletterController.deleteNewsletterItem);

// Ruta para historial de notificaciones
router.get('/historial/notificaciones', protect, newsletterController.getHistorialNotificaciones);

module.exports = router;

