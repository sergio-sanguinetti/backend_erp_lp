// services/configuracion.service.js

const { prisma } = require('../config/database');

// Obtener la configuración única (solo debe haber una fila)
exports.getConfiguracion = async () => {
  // Validar que el modelo esté disponible
  if (!prisma.configuracion) {
    throw new Error('Modelo Configuracion no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate');
  }

  // Buscar la primera configuración (solo debería haber una)
  const configuracion = await prisma.configuracion.findFirst();

  // Si no existe, crear una con valores por defecto
  if (!configuracion) {
    return await prisma.configuracion.create({
      data: {
        precioPorLitroGasLP: 18.50,
        precioPorKG: 18.50
      }
    });
  }

  return configuracion;
};

// Actualizar la configuración única
exports.updateConfiguracion = async (updateData) => {
  // Buscar la configuración existente
  let configuracion = await prisma.configuracion.findFirst();

  // Si no existe, crearla
  if (!configuracion) {
    configuracion = await prisma.configuracion.create({
      data: {
        precioPorLitroGasLP: updateData.precioPorLitroGasLP || 18.50,
        precioPorKG: updateData.precioPorKG || 18.50
      }
    });
  } else {
    // Actualizar la configuración existente
    configuracion = await prisma.configuracion.update({
      where: { id: configuracion.id },
      data: {
        precioPorLitroGasLP: updateData.precioPorLitroGasLP !== undefined 
          ? updateData.precioPorLitroGasLP 
          : configuracion.precioPorLitroGasLP,
        precioPorKG: updateData.precioPorKG !== undefined 
          ? updateData.precioPorKG 
          : configuracion.precioPorKG
      }
    });
  }

  return configuracion;
};

