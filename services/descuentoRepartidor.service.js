// services/descuentoRepartidor.service.js

const { prisma } = require('../config/database');

exports.getAllDescuentos = async () => {
  // Validar que el modelo esté disponible
  if (!prisma.descuentoRepartidor) {
    throw new Error('Modelo DescuentoRepartidor no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate');
  }

  const descuentos = await prisma.descuentoRepartidor.findMany({
    include: {
      repartidor: true
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  return descuentos;
};

exports.findDescuentoById = async (id) => {
  const descuento = await prisma.descuentoRepartidor.findUnique({
    where: { id },
    include: {
      repartidor: true
    }
  });

  return descuento;
};

exports.findDescuentoByRepartidor = async (repartidorId) => {
  const descuentos = await prisma.descuentoRepartidor.findMany({
    where: { repartidorId },
    include: {
      repartidor: true
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  return descuentos;
};

exports.createDescuento = async (descuentoData) => {
  // Verificar que el repartidor existe
  const repartidor = await prisma.usuario.findUnique({
    where: { id: descuentoData.repartidorId }
  });
  
  if (!repartidor) {
    const error = new Error('El repartidor especificado no existe.');
    error.status = 404;
    throw error;
  }

  // Permitir múltiples descuentos por repartidor - validación de duplicados eliminada

  const nuevoDescuento = await prisma.descuentoRepartidor.create({
    data: {
      repartidorId: descuentoData.repartidorId,
      nombre: descuentoData.nombre || null,
      descripcion: descuentoData.descripcion || null,
      descuentoAutorizado: descuentoData.descuentoAutorizado || 0,
      descuentoPorLitro: descuentoData.descuentoPorLitro || null,
      activo: descuentoData.activo !== undefined ? descuentoData.activo : true
    },
    include: {
      repartidor: true
    }
  });

  return nuevoDescuento;
};

exports.updateDescuento = async (id, updateData) => {
  // Verificar que el descuento existe
  const descuentoExistente = await prisma.descuentoRepartidor.findUnique({
    where: { id }
  });

  if (!descuentoExistente) {
    const error = new Error('Descuento no encontrado.');
    error.status = 404;
    throw error;
  }

  const descuentoActualizado = await prisma.descuentoRepartidor.update({
    where: { id },
    data: {
      nombre: updateData.nombre !== undefined ? updateData.nombre : descuentoExistente.nombre,
      descripcion: updateData.descripcion !== undefined ? updateData.descripcion : descuentoExistente.descripcion,
      descuentoAutorizado: updateData.descuentoAutorizado !== undefined ? updateData.descuentoAutorizado : descuentoExistente.descuentoAutorizado,
      descuentoPorLitro: updateData.descuentoPorLitro !== undefined ? updateData.descuentoPorLitro : descuentoExistente.descuentoPorLitro,
      activo: updateData.activo !== undefined ? updateData.activo : descuentoExistente.activo
    },
    include: {
      repartidor: true
    }
  });

  return descuentoActualizado;
};

exports.deleteDescuento = async (id) => {
  // Verificar que el descuento existe
  const descuento = await prisma.descuentoRepartidor.findUnique({
    where: { id }
  });

  if (!descuento) {
    const error = new Error('Descuento no encontrado.');
    error.status = 404;
    throw error;
  }

  await prisma.descuentoRepartidor.delete({
    where: { id }
  });

  return descuento;
};



