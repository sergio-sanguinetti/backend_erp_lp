// services/producto.service.js

const { prisma } = require('../config/database');

exports.getAllProductos = async (filtros = {}) => {
  const where = {};
  
  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }
  
  if (filtros.activo !== undefined) {
    where.activo = filtros.activo === 'true' || filtros.activo === true;
  }
  
  if (filtros.sedeId) {
    where.sedeId = filtros.sedeId;
  }

  const productos = await prisma.producto.findMany({
    where,
    include: {
      sede: true
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  return productos;
};

exports.findProductoById = async (id) => {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      sede: true
    }
  });

  return producto;
};

exports.createProducto = async (productoData) => {
  // Verificar que la sede existe si se proporciona
  if (productoData.sedeId) {
    const sede = await prisma.sede.findUnique({
      where: { id: productoData.sedeId }
    });
    
    if (!sede) {
      const error = new Error('La sede especificada no existe.');
      error.status = 404;
      throw error;
    }
  }

  const nuevoProducto = await prisma.producto.create({
    data: {
      nombre: productoData.nombre,
      categoria: productoData.categoria,
      precio: productoData.precio,
      unidad: productoData.unidad,
      descripcion: productoData.descripcion || null,
      activo: productoData.activo !== undefined ? productoData.activo : true,
      sedeId: productoData.sedeId || null
    },
    include: {
      sede: true
    }
  });

  return nuevoProducto;
};

exports.updateProducto = async (id, updateData) => {
  // Verificar que el producto existe
  const productoExistente = await prisma.producto.findUnique({
    where: { id }
  });

  if (!productoExistente) {
    const error = new Error('Producto no encontrado.');
    error.status = 404;
    throw error;
  }

  // Verificar que la sede existe si se proporciona
  if (updateData.sedeId) {
    const sede = await prisma.sede.findUnique({
      where: { id: updateData.sedeId }
    });
    
    if (!sede) {
      const error = new Error('La sede especificada no existe.');
      error.status = 404;
      throw error;
    }
  }

  const productoActualizado = await prisma.producto.update({
    where: { id },
    data: {
      nombre: updateData.nombre,
      categoria: updateData.categoria,
      precio: updateData.precio,
      unidad: updateData.unidad,
      descripcion: updateData.descripcion,
      activo: updateData.activo,
      sedeId: updateData.sedeId !== undefined ? updateData.sedeId : productoExistente.sedeId
    },
    include: {
      sede: true
    }
  });

  return productoActualizado;
};

exports.deleteProducto = async (id) => {
  // Verificar que el producto existe
  const producto = await prisma.producto.findUnique({
    where: { id }
  });

  if (!producto) {
    const error = new Error('Producto no encontrado.');
    error.status = 404;
    throw error;
  }

  await prisma.producto.delete({
    where: { id }
  });

  return producto;
};

