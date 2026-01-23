const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateRegistration } = require('../middlewares/validation.middleware');

// Rutas públicas
router.post('/register', validateRegistration, usuarioController.register);
router.post('/login', usuarioController.login);
router.post('/repartidor/login', usuarioController.loginRepartidor);

// Ruta para el segundo paso del login (verificación 2FA)
// Se protege para asegurar que se use un token temporal válido
router.post('/login/verify-2fa', protect, usuarioController.verifyLogin2FA);

// Rutas protegidas (requieren token de sesión válido)
router.get('/profile', protect, usuarioController.getProfile);
router.put('/profile', protect, usuarioController.updateProfile);
router.post('/change-password', protect, usuarioController.changePassword);
router.post('/2fa/setup', protect, usuarioController.setup2FA);
router.post('/2fa/enable', protect, usuarioController.verifyAndEnable2FA);
router.post('/2fa/disable', protect, usuarioController.disable2FA);

// Rutas de administración (solo para administradores)
router.get('/admin/all', protect, usuarioController.getAllUsuarios);
router.get('/admin/:id', protect, usuarioController.getUsuarioById);
router.put('/admin/:id', protect, usuarioController.updateUsuario);
router.delete('/admin/:id', protect, usuarioController.deleteUsuario);
router.get('/admin/stats/usuarios', protect, usuarioController.getUsuariosStats);

module.exports = router;