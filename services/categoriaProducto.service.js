// services/categoriaProducto.service.js

const { prisma } = require('../config/database');

exports.getAllCategorias = async (filtros = {}) => {
  const where = {};
  
  if (filtros.activa !== undefined) {
    where.activa = filtros.activa === 'true' || filtros.activa === true;
  }

  const categorias = await prisma.categoriaProducto.findMany({
    where,
    include: {
      _count: {
        select: { productos: true }
      }
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  return categorias;
};

exports.findCategoriaById = async (id) => {
  const categoria = await prisma.categoriaProducto.findUnique({
    where: { id },
    include: {
      _count: {
        select: { productos: true }
      }
    }
  });

  return categoria;
};

exports.findCategoriaByCodigo = async (codigo) => {
  const categoria = await prisma.categoriaProducto.findUnique({
    where: { codigo }
  });

  return categoria;
};

exports.createCategoria = async (categoriaData) => {
  // Verificar que el código no exista
  const categoriaExistente = await prisma.categoriaProducto.findUnique({
    where: { codigo: categoriaData.codigo }
  });

  if (categoriaExistente) {
    const error = new Error('Ya existe una categoría con ese código.');
    error.status = 409;
    throw error;
  }

  // Verificar que el nombre no exista
  const nombreExistente = await prisma.categoriaProducto.findUnique({
    where: { nombre: categoriaData.nombre }
  });

  if (nombreExistente) {
    const error = new Error('Ya existe una categoría con ese nombre.');
    error.status = 409;
    throw error;
  }

  const nuevaCategoria = await prisma.categoriaProducto.create({
    data: {
      nombre: categoriaData.nombre,
      codigo: categoriaData.codigo.toLowerCase().replace(/\s+/g, '_'),
      descripcion: categoriaData.descripcion || null,
      activa: categoriaData.activa !== undefined ? categoriaData.activa : true
    }
  });

  return nuevaCategoria;
};

exports.updateCategoria = async (id, updateData) => {
  // Verificar que la categoría existe
  const categoriaExistente = await prisma.categoriaProducto.findUnique({
    where: { id }
  });

  if (!categoriaExistente) {
    const error = new Error('Categoría no encontrada.');
    error.status = 404;
    throw error;
  }

  // Verificar que el código no esté en uso por otra categoría
  if (updateData.codigo && updateData.codigo !== categoriaExistente.codigo) {
    const codigoExistente = await prisma.categoriaProducto.findUnique({
      where: { codigo: updateData.codigo.toLowerCase().replace(/\s+/g, '_') }
    });

    if (codigoExistente) {
      const error = new Error('Ya existe una categoría con ese código.');
      error.status = 409;
      throw error;
    }
  }

  // Verificar que el nombre no esté en uso por otra categoría
  if (updateData.nombre && updateData.nombre !== categoriaExistente.nombre) {
    const nombreExistente = await prisma.categoriaProducto.findUnique({
      where: { nombre: updateData.nombre }
    });

    if (nombreExistente) {
      const error = new Error('Ya existe una categoría con ese nombre.');
      error.status = 409;
      throw error;
    }
  }

  const categoriaActualizada = await prisma.categoriaProducto.update({
    where: { id },
    data: {
      nombre: updateData.nombre !== undefined ? updateData.nombre : categoriaExistente.nombre,
      codigo: updateData.codigo ? updateData.codigo.toLowerCase().replace(/\s+/g, '_') : categoriaExistente.codigo,
      descripcion: updateData.descripcion !== undefined ? updateData.descripcion : categoriaExistente.descripcion,
      activa: updateData.activa !== undefined ? updateData.activa : categoriaExistente.activa
    }
  });

  return categoriaActualizada;
};

exports.deleteCategoria = async (id) => {
  // Verificar que la categoría existe
  const categoria = await prisma.categoriaProducto.findUnique({
    where: { id },
    include: {
      _count: {
        select: { productos: true }
      }
    }
  });

  if (!categoria) {
    const error = new Error('Categoría no encontrada.');
    error.status = 404;
    throw error;
  }

  // Verificar que no tenga productos asociados
  if (categoria._count.productos > 0) {
    const error = new Error('No se puede eliminar la categoría porque tiene productos asociados.');
    error.status = 409;
    throw error;
  }

  await prisma.categoriaProducto.delete({
    where: { id }
  });

  return categoria;
};



