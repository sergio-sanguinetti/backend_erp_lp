// Importaciones de módulos principales
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); // <-- LÍNEA CORREGIDA
require('dotenv').config();

// Importaciones locales
const config = require('./config');
const { connectDB } = require('./config/database');
const errorHandler = require('./utils/errorHandler');

// Rutas
const usuarioRoutes = require('./api/routes/usuario.routes');
const sedeRoutes = require('./api/routes/sede.routes');
const formaPagoRoutes = require('./api/routes/formaPago.routes');
const tipoFormaPagoRoutes = require('./api/routes/tipoFormaPago.routes');
const rutaRoutes = require('./api/routes/ruta.routes');
const zonaRoutes = require('./api/routes/zona.routes');
const clienteRoutes = require('./api/routes/cliente.routes');
const productoRoutes = require('./api/routes/producto.routes');
const pedidoRoutes = require('./api/routes/pedido.routes');
const creditoAbonoRoutes = require('./api/routes/creditoAbono.routes');
const newsletterRoutes = require('./api/routes/newsletter.routes');
const configuracionRoutes = require('./api/routes/configuracion.routes');
const configuracionTicketRoutes = require('./api/routes/configuracionTicket.routes');
const descuentoRepartidorRoutes = require('./api/routes/descuentoRepartidor.routes');
const categoriaProductoRoutes = require('./api/routes/categoriaProducto.routes');
const reporteRoutes = require('./api/routes/reporte.routes');
const reporteFinancieroRoutes = require('./api/routes/reporteFinanciero.routes');
const corteCajaRoutes = require('./api/routes/corteCaja.routes');
const ventasRoutes = require('./api/routes/ventas.routes');

// Inicialización de Express
const app = express();
const server = http.createServer(app);

// Conexión a la base de datos
connectDB();

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    // Permitir conexiones desde la red local (para Expo Go en dispositivos físicos)
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Permite cualquier IP local (192.168.x.x)
    /^http:\/\/10\.0\.2\.2:\d+$/, // Para emulador Android
    'https://konfio-front.vercel.app',
    'https://konfio-front-git-main-sergio-sanguinetti.vercel.app',
    'https://konfio-front-sergio-sanguinetti.vercel.app',
    'https://konfio-front-git-main-sergio-sanguinettis-projects.vercel.app',
    'https://konfio-front-sergio-sanguinettis-projects.vercel.app',
    /^https:\/\/konfio-front.*\.vercel\.app$/, // Permite cualquier subdominio de vercel.app
    /^https:\/\/.*\.vercel\.app$/ // Permite cualquier dominio de Vercel
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Middlewares
app.use(cors(corsOptions)); // Habilita CORS con configuración específica
app.use(helmet()); // Añade cabeceras de seguridad
// Límite de 20MB para permitir subida de imágenes en base64 (newsletter, etc.)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (config.nodeEnv === 'development') {
    app.use(morgan('dev')); // Logger de peticiones en desarrollo
}


// Middleware de logging global para todas las peticiones
app.use((req, res, next) => {
    console.log(`[GLOBAL] ${req.method} ${req.originalUrl}`, {
        headers: req.headers.authorization ? 'has auth' : 'no auth',
        contentType: req.headers['content-type'],
        origin: req.headers.origin
    });
    next();
});

// Manejar preflight OPTIONS explícitamente
app.options('*', (req, res) => {
    console.log(`[OPTIONS] Preflight request: ${req.originalUrl}`);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Rutas de la API
app.get('/', (req, res) => {
    res.json({ message: `Bienvenido a la API de ${config.appName}` });
});

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend funcionando correctamente', timestamp: new Date().toISOString() });
});
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/formas-pago', formaPagoRoutes);
app.use('/api/tipos-forma-pago', tipoFormaPagoRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/zonas', zonaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/creditos-abonos', creditoAbonoRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/configuraciones', configuracionRoutes);
app.use('/api/configuracion-tickets', configuracionTicketRoutes);
app.use('/api/descuentos-repartidor', descuentoRepartidorRoutes);
app.use('/api/categorias-producto', categoriaProductoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/reportes-financieros', reporteFinancieroRoutes);
app.use('/api/cortes-caja', corteCajaRoutes);
app.use('/api/ventas', ventasRoutes);

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    console.log(`[404] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    console.log(`[404] Headers:`, req.headers);
    console.log(`[404] Body:`, req.body);
    const error = new Error('Ruta no encontrada');
    error.status = 404;
    next(error);
});

// Middleware de manejo de errores global
app.use(errorHandler);

// Iniciar el servidor
server.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
});