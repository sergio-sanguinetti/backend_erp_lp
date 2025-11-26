// Script para crear un usuario de prueba
require('dotenv').config();
const { prisma, connectDB } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        // Conectar a la base de datos
        await connectDB();

        // Datos del usuario de prueba
        const usuarioData = {
            nombres: 'Juan',
            apellidoPaterno: 'Pérez',
            apellidoMaterno: 'García',
            email: 'admin@test.com',
            password: '123456', // Se hasheará automáticamente
            telefono: '5551234567',
            rol: 'administrador',
            estado: 'activo',
            sede: 'Sede Central'
        };

        // Verificar si el usuario ya existe
        const existingUser = await prisma.usuario.findUnique({
            where: { email: usuarioData.email.toLowerCase() }
        });

        if (existingUser) {
            console.log('⚠️  El usuario ya existe:', usuarioData.email);
            console.log('   Puedes usar este usuario para hacer login.');
            await prisma.$disconnect();
            return;
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(usuarioData.password, salt);

        // Crear el usuario
        const usuario = await prisma.usuario.create({
            data: {
                nombres: usuarioData.nombres,
                apellidoPaterno: usuarioData.apellidoPaterno,
                apellidoMaterno: usuarioData.apellidoMaterno,
                email: usuarioData.email.toLowerCase(),
                password: hashedPassword,
                telefono: usuarioData.telefono,
                rol: usuarioData.rol,
                estado: usuarioData.estado,
                sede: usuarioData.sede
            }
        });

        console.log('✅ Usuario creado exitosamente!');
        console.log('\n📋 Datos del usuario:');
        console.log('   Email:', usuario.email);
        console.log('   Contraseña:', usuarioData.password);
        console.log('   Nombre completo:', `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`);
        console.log('   Rol:', usuario.rol);
        console.log('   Estado:', usuario.estado);
        console.log('\n💡 Usa estos datos para hacer login en Postman');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error al crear usuario:', error.message);
        if (error.code === 'P2002') {
            console.error('   El email ya está en uso.');
        }
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Ejecutar el script
createTestUser();

