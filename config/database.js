const { PrismaClient } = require('@prisma/client');
const config = require('./index');

const prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('MySQL conectado exitosamente con Prisma.');
    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
        
        // En desarrollo, solo mostrar advertencia
        if (config.nodeEnv === 'development') {
            console.warn('⚠️  MySQL no disponible. Algunas funcionalidades pueden no funcionar.');
            console.warn('   Para habilitar MySQL, asegúrate de que esté ejecutándose y configurado correctamente.');
        } else {
            // En producción, salir del proceso con fallo
            process.exit(1);
        }
    }
};

// Manejar desconexión al cerrar la aplicación
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = { prisma, connectDB };
