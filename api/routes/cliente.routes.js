const express = require('express');
const router = express.Router();
const multer = require('multer');
const clienteController = require('../controllers/cliente.controller');
const { protect } = require('../middlewares/auth.middleware');

// Configurar multer para subida de archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo archivos Excel y CSV
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'application/csv'
        ];
        
        if (allowedMimes.includes(file.mimetype) || 
            file.originalname.endsWith('.xlsx') || 
            file.originalname.endsWith('.xls') || 
            file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls) o CSV (.csv)'));
        }
    }
});

// Rutas de clientes (by-rutas y buscar-por-qr antes de :id para que no se interpreten como id)
router.get('/by-rutas', clienteController.getClientesByRutasPaginated);
router.get('/buscar-por-qr', clienteController.buscarPorQR);
router.get('/', clienteController.getAllClientes);
router.get('/:id', clienteController.getClienteById);
router.post('/', protect, clienteController.createCliente);
router.post('/importar-masivo', protect, upload.single('archivo'), clienteController.importarClientesMasivo);
router.put('/:id', protect, clienteController.updateCliente);
router.delete('/:id', protect, clienteController.deleteCliente);

// Rutas de domicilios
router.get('/:clienteId/domicilios', clienteController.getDomiciliosByCliente);
router.post('/:clienteId/domicilios', protect, clienteController.createDomicilio);
router.put('/domicilios/:id', protect, clienteController.updateDomicilio);
router.delete('/domicilios/:id', protect, clienteController.deleteDomicilio);

module.exports = router;

