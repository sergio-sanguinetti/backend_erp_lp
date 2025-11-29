// Script Node.js para generar hashes de contraseñas con bcryptjs
// Uso: node scripts/generate_password_hash.js

const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123'; // Cambiar por la contraseña deseada
  
  console.log('Generando hash para contraseña:', password);
  console.log('=====================================\n');
  
  // Usar el mismo método que el servicio de usuario (genSalt + hash)
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Hash generado:');
  console.log(hash);
  console.log('\n=====================================');
  console.log('Copia este hash y úsalo en los scripts SQL');
  console.log('Ejemplo:');
  console.log(`'${hash}'`);
  
  // Verificar que el hash funciona
  const isValid = await bcrypt.compare(password, hash);
  console.log('\nVerificación:', isValid ? '✓ Hash válido' : '✗ Hash inválido');
  
  console.log('\n=====================================');
  console.log('Para generar múltiples hashes, puedes ejecutar:');
  console.log('node scripts/generate_password_hash.js');
}

generateHashes().catch(console.error);


