// services/newsletter.service.js

const { prisma } = require('../config/database');

exports.getAllNewsletterItems = async (filtros = {}) => {
  const where = {};
  
  if (filtros.type) {
    where.type = filtros.type;
  }
  
  if (filtros.activo !== undefined) {
    where.activo = filtros.activo === 'true' || filtros.activo === true;
  }
  
  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.fechaCreacion = {};
    if (filtros.fechaDesde) {
      where.fechaCreacion.gte = new Date(filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      where.fechaCreacion.lte = new Date(filtros.fechaHasta);
    }
  }

  return await prisma.newsletterItem.findMany({
    where,
    orderBy: {
      fechaCreacion: 'desc'
    }
  });
};

exports.getNewsletterItemById = async (id) => {
  const item = await prisma.newsletterItem.findUnique({
    where: { id }
  });

  if (!item) {
    const error = new Error('Item del newsletter no encontrado');
    error.status = 404;
    throw error;
  }

  return item;
};

exports.createNewsletterItem = async (itemData, usuarioId) => {
  const data = {
    type: itemData.type,
    title: itemData.title || null,
    content: itemData.content || null,
    description: itemData.description || null,
    imageUrl: itemData.imageUrl || null,
    fechaVencimiento: itemData.fechaVencimiento ? new Date(itemData.fechaVencimiento) : null,
    size: itemData.size || 'medium',
    activo: itemData.activo !== undefined ? itemData.activo : true,
    usuarioCreacion: usuarioId || null
  };

  return await prisma.newsletterItem.create({
    data
  });
};

exports.updateNewsletterItem = async (id, itemData, usuarioId) => {
  // Verificar que el item existe
  const existingItem = await prisma.newsletterItem.findUnique({
    where: { id }
  });

  if (!existingItem) {
    const error = new Error('Item del newsletter no encontrado');
    error.status = 404;
    throw error;
  }

  const data = {};
  
  if (itemData.title !== undefined) data.title = itemData.title;
  if (itemData.content !== undefined) data.content = itemData.content;
  if (itemData.description !== undefined) data.description = itemData.description;
  if (itemData.imageUrl !== undefined) data.imageUrl = itemData.imageUrl;
  if (itemData.fechaVencimiento !== undefined) {
    data.fechaVencimiento = itemData.fechaVencimiento ? new Date(itemData.fechaVencimiento) : null;
  }
  if (itemData.size !== undefined) data.size = itemData.size;
  if (itemData.activo !== undefined) data.activo = itemData.activo;
  if (usuarioId) data.usuarioModificacion = usuarioId;

  return await prisma.newsletterItem.update({
    where: { id },
    data
  });
};

exports.deleteNewsletterItem = async (id) => {
  const item = await prisma.newsletterItem.findUnique({
    where: { id }
  });

  if (!item) {
    const error = new Error('Item del newsletter no encontrado');
    error.status = 404;
    throw error;
  }

  return await prisma.newsletterItem.delete({
    where: { id }
  });
};

exports.getHistorialNotificaciones = async () => {
  return await prisma.newsletterItem.findMany({
    where: {
      type: 'notification'
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });
};

