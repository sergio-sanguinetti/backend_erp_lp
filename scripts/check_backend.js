// Script para verificar si el backend está corriendo
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

console.log('Verificando conexión al backend...');
console.log('URL:', API_URL);
console.log('=====================================\n');

// Intentar hacer una petición simple al backend
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend está corriendo!');
  console.log('Estado:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nRespuesta del servidor:');
    console.log(data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error al conectar con el backend:');
  console.error('   Mensaje:', error.message);
  console.error('\n💡 Posibles soluciones:');
  console.error('   1. Verifica que el backend esté corriendo:');
  console.error('      cd backend_erp_lp');
  console.error('      npm start');
  console.error('      o');
  console.error('      npm run dev');
  console.error('\n   2. Verifica que el puerto 3001 esté disponible');
  console.error('\n   3. Verifica la configuración en .env');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout: El backend no responde');
  req.destroy();
  process.exit(1);
});

req.end();


