// services/producto.service.js

const { prisma } = require('../config/database');

exports.getAllProductos = async (filtros = {}) => {
  // Construir where clause explícitamente, asegurándonos de usar solo campos que existen en la tabla
  const where = {};

  // Solo usar categoriaId, nunca categoria (que es una relación, no una columna)
  if (filtros.categoria) {
    where.categoriaId = filtros.categoria;
  }

  if (filtros.activo !== undefined) {
    where.activo = filtros.activo === 'true' || filtros.activo === true;
  }

  if (filtros.sedeId) {
    where.sedeId = filtros.sedeId;
  }

  if (filtros.updatedAfter) {
    const date = new Date(filtros.updatedAfter);
    if (!isNaN(date.getTime())) {
      where.updatedAt = {
        gte: date
      };
    }
  }

  // Obtener productos SOLO con sede, sin intentar incluir categoria (es una relación)
  // Esto evita que Prisma intente acceder a una columna 'categoria' que no existe
  const productos = await prisma.producto.findMany({
    where: {
      ...where,
      // Asegurarse de que no haya referencias a 'categoria' como columna
    },
    select: {
      id: true,
      nombre: true,
      categoriaId: true,
      precio: true,
      unidad: true,
      descripcion: true,
      cantidadKilos: true,
      activo: true,
      sedeId: true,
      fechaCreacion: true,
      fechaModificacion: true,
      createdAt: true,
      updatedAt: true,
      sede: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          email: true,
          estado: true,
          fechaCreacion: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  // Agregar categoria manualmente para cada producto
  for (const producto of productos) {
    if (producto.categoriaId) {
      try {
        producto.categoria = await prisma.categoriaProducto.findUnique({
          where: { id: producto.categoriaId }
        });
      } catch (e) {
        // Si falla, dejar categoria como null
        producto.categoria = null;
      }
    } else {
      producto.categoria = null;
    }
  }

  return productos;
};

exports.findProductoById = async (id) => {
  // Usar select en lugar de include para evitar problemas con relaciones
  const producto = await prisma.producto.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      categoriaId: true,
      precio: true,
      unidad: true,
      descripcion: true,
      cantidadKilos: true,
      activo: true,
      sedeId: true,
      fechaCreacion: true,
      fechaModificacion: true,
      createdAt: true,
      updatedAt: true,
      sede: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          email: true,
          estado: true,
          fechaCreacion: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  // Agregar categoria manualmente si es necesario
  if (producto && producto.categoriaId) {
    try {
      producto.categoria = await prisma.categoriaProducto.findUnique({
        where: { id: producto.categoriaId }
      });
    } catch (e) {
      producto.categoria = null;
    }
  } else if (producto) {
    producto.categoria = null;
  }

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

  // Verificar que la categoría existe
  const categoria = await prisma.categoriaProducto.findUnique({
    where: { id: productoData.categoriaId }
  });

  if (!categoria) {
    const error = new Error('La categoría especificada no existe.');
    error.status = 404;
    throw error;
  }

  const nuevoProducto = await prisma.producto.create({
    data: {
      nombre: productoData.nombre,
      categoriaId: productoData.categoriaId,
      precio: productoData.precio,
      unidad: productoData.unidad,
      descripcion: productoData.descripcion || null,
      cantidadKilos: productoData.cantidadKilos || null,
      activo: productoData.activo !== undefined ? productoData.activo : true,
      sedeId: productoData.sedeId || null
    },
    select: {
      id: true,
      nombre: true,
      categoriaId: true,
      precio: true,
      unidad: true,
      descripcion: true,
      cantidadKilos: true,
      activo: true,
      sedeId: true,
      fechaCreacion: true,
      fechaModificacion: true,
      createdAt: true,
      updatedAt: true,
      sede: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          email: true,
          estado: true,
          fechaCreacion: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  // Agregar categoria manualmente
  if (nuevoProducto.categoriaId) {
    try {
      nuevoProducto.categoria = await prisma.categoriaProducto.findUnique({
        where: { id: nuevoProducto.categoriaId }
      });
    } catch (e) {
      nuevoProducto.categoria = null;
    }
  }

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

  // Verificar que la categoría existe si se proporciona
  if (updateData.categoriaId) {
    const categoria = await prisma.categoriaProducto.findUnique({
      where: { id: updateData.categoriaId }
    });

    if (!categoria) {
      const error = new Error('La categoría especificada no existe.');
      error.status = 404;
      throw error;
    }
  }

  const productoActualizado = await prisma.producto.update({
    where: { id },
    data: {
      nombre: updateData.nombre,
      categoriaId: updateData.categoriaId !== undefined ? updateData.categoriaId : productoExistente.categoriaId,
      precio: updateData.precio,
      unidad: updateData.unidad,
      descripcion: updateData.descripcion,
      cantidadKilos: updateData.cantidadKilos !== undefined ? updateData.cantidadKilos : productoExistente.cantidadKilos,
      activo: updateData.activo,
      sedeId: updateData.sedeId !== undefined ? updateData.sedeId : productoExistente.sedeId
    },
    select: {
      id: true,
      nombre: true,
      categoriaId: true,
      precio: true,
      unidad: true,
      descripcion: true,
      cantidadKilos: true,
      activo: true,
      sedeId: true,
      fechaCreacion: true,
      fechaModificacion: true,
      createdAt: true,
      updatedAt: true,
      sede: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          email: true,
          estado: true,
          fechaCreacion: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  // Agregar categoria manualmente
  if (productoActualizado.categoriaId) {
    try {
      productoActualizado.categoria = await prisma.categoriaProducto.findUnique({
        where: { id: productoActualizado.categoriaId }
      });
    } catch (e) {
      productoActualizado.categoria = null;
    }
  }

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

