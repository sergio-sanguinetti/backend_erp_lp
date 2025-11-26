const express = require('express');
const router = express.Router();
const zonaController = require('../controllers/zona.controller');
const { protect } = require('../middlewares/auth.middleware');

// ========== CIUDADES ==========
// Rutas públicas (para obtener lista de ciudades)
router.get('/ciudades', zonaController.getAllCiudades);
router.get('/ciudades/:id', zonaController.getCiudadById);

// Rutas protegidas (solo administradores)
router.post('/ciudades', protect, zonaController.createCiudad);
router.put('/ciudades/:id', protect, zonaController.updateCiudad);
router.delete('/ciudades/:id', protect, zonaController.deleteCiudad);

// ========== MUNICIPIOS ==========
// Rutas públicas (para obtener lista de municipios)
router.get('/municipios', zonaController.getAllMunicipios);
router.get('/municipios/:id', zonaController.getMunicipioById);

// Rutas protegidas (solo administradores)
router.post('/municipios', protect, zonaController.createMunicipio);
router.put('/municipios/:id', protect, zonaController.updateMunicipio);
router.delete('/municipios/:id', protect, zonaController.deleteMunicipio);

// ========== ZONAS ==========
// Rutas públicas (para obtener lista de zonas)
router.get('/', zonaController.getAllZonas);
router.get('/:id', zonaController.getZonaById);

// Rutas protegidas (solo administradores)
router.post('/', protect, zonaController.createZona);
router.put('/:id', protect, zonaController.updateZona);
router.delete('/:id', protect, zonaController.deleteZona);

module.exports = router;

