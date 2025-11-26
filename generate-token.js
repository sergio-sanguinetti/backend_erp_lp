const jwt = require('jsonwebtoken');
require('dotenv').config();
const config = require('./config');

// Configuración
const payload = {
  id: 'mock_user_id',
  email: 'test@example.com',
  nombres: 'Usuario',
  apellidoPaterno: 'De',
  apellidoMaterno: 'Prueba',
  rol: 'administrador', // Puedes cambiar el rol según necesites
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
};

// Generar token
const token = jwt.sign(payload, config.jwtSecret || 'default_secret_key');

console.log('Token JWT generado:');
console.log(token);
console.log('\nPara usar en curl:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:${config.port || 3001}/api/usuarios/profile`);
