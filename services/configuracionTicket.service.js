// services/configuracionTicket.service.js

const { prisma } = require('../config/database');

// Obtener todas las configuraciones de tickets
exports.getAllConfiguracionesTicket = async () => {
  // Validar que el modelo esté disponible
  if (!prisma.configuracionTicket) {
    console.warn('Modelo ConfiguracionTicket no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate');
    return [];
  }

  try {
    const configuraciones = await prisma.configuracionTicket.findMany({
      where: { activo: true },
      orderBy: { tipoTicket: 'asc' }
    });

    return configuraciones;
  } catch (error) {
    // Si la tabla no existe, retornar array vacío en lugar de lanzar error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      console.warn('Tabla configuracion_tickets no existe aún. Ejecuta la migración de Prisma.');
      return [];
    }
    throw error;
  }
};

// Obtener la configuración de tickets por tipo
exports.getConfiguracionTicket = async (tipoTicket = 'venta') => {
  // Validar que el modelo esté disponible
  if (!prisma.configuracionTicket) {
    console.warn('Modelo ConfiguracionTicket no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate');
    // Retornar valores por defecto en lugar de lanzar error
    return {
      id: '',
      tipoTicket,
      nombreEmpresa: 'Mi Empresa S.A. de C.V.',
      razonSocial: 'Mi Empresa Sociedad Anónima de Capital Variable',
      direccion: 'Av. Principal #123, Col. Centro, CDMX, CP 06000',
      telefono: '(55) 1234-5678',
      email: 'contacto@miempresa.com',
      sitioWeb: 'www.miempresa.com',
      rfc: 'MEMP950101ABC',
      mostrarLogo: true,
      tamañoLogo: 'mediano',
      redesSocialesFacebook: null,
      redesSocialesInstagram: null,
      redesSocialesTwitter: null,
      redesSocialesLinkedin: null,
      redesSocialesWhatsapp: null,
      mostrarRedesSociales: true,
      textoEncabezado: '¡Gracias por su compra!',
      textoPiePagina: 'Visite nuestro sitio web para más información',
      mensajeEspecial: null,
      mostrarMensajeEspecial: false,
      mostrarFecha: true,
      mostrarHora: true,
      mostrarCajero: true,
      mostrarCliente: true,
      colorPrincipal: '#1976d2',
      alineacion: 'centro',
      urlQR: null,
      activo: true,
      fechaCreacion: new Date(),
      fechaModificacion: new Date()
    };
  }

  try {
    // Buscar la configuración por tipo
    let configuracion = await prisma.configuracionTicket.findUnique({
      where: { tipoTicket }
    });

    // Si no existe, crear una con valores por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracionTicket.create({
        data: {
          tipoTicket,
          nombreEmpresa: 'Mi Empresa S.A. de C.V.',
          razonSocial: 'Mi Empresa Sociedad Anónima de Capital Variable',
          direccion: 'Av. Principal #123, Col. Centro, CDMX, CP 06000',
          telefono: '(55) 1234-5678',
          email: 'contacto@miempresa.com',
          sitioWeb: 'www.miempresa.com',
          rfc: 'MEMP950101ABC',
          mostrarLogo: true,
          tamañoLogo: 'mediano',
          mostrarRedesSociales: true,
          mostrarFecha: true,
          mostrarHora: true,
          mostrarCajero: true,
          mostrarCliente: true,
          colorPrincipal: '#1976d2',
          alineacion: 'centro',
          textoEncabezado: '¡Gracias por su compra!',
          textoPiePagina: 'Visite nuestro sitio web para más información',
          mostrarMensajeEspecial: false,
          activo: true
        }
      });
    }

    return configuracion;
  } catch (error) {
    // Si la tabla no existe, retornar valores por defecto en lugar de lanzar error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      console.warn('Tabla configuracion_tickets no existe aún. Ejecuta la migración de Prisma.');
      return {
        id: '',
        tipoTicket,
        nombreEmpresa: 'Mi Empresa S.A. de C.V.',
        razonSocial: 'Mi Empresa Sociedad Anónima de Capital Variable',
        direccion: 'Av. Principal #123, Col. Centro, CDMX, CP 06000',
        telefono: '(55) 1234-5678',
        email: 'contacto@miempresa.com',
        sitioWeb: 'www.miempresa.com',
        rfc: 'MEMP950101ABC',
        mostrarLogo: true,
        tamañoLogo: 'mediano',
        redesSocialesFacebook: null,
        redesSocialesInstagram: null,
        redesSocialesTwitter: null,
        redesSocialesLinkedin: null,
        redesSocialesWhatsapp: null,
        mostrarRedesSociales: true,
        textoEncabezado: '¡Gracias por su compra!',
        textoPiePagina: 'Visite nuestro sitio web para más información',
        mensajeEspecial: null,
        mostrarMensajeEspecial: false,
        mostrarFecha: true,
        mostrarHora: true,
        mostrarCajero: true,
        mostrarCliente: true,
          colorPrincipal: '#1976d2',
          alineacion: 'centro',
          urlQR: null,
          activo: true,
          fechaCreacion: new Date(),
          fechaModificacion: new Date()
      };
    }
    throw error;
  }
};

// Actualizar la configuración de tickets
exports.updateConfiguracionTicket = async (updateData) => {
  // Validar que el modelo esté disponible
  if (!prisma.configuracionTicket) {
    throw new Error('Modelo ConfiguracionTicket no está disponible en Prisma. Por favor, regenera el cliente de Prisma ejecutando: npx prisma generate');
  }

  const tipoTicket = updateData.tipoTicket || 'venta';
  
  try {
    // Buscar la configuración existente por tipo
    let configuracion = await prisma.configuracionTicket.findUnique({
      where: { tipoTicket }
    });

    const dataToUpdate = {};
    
    // Mapear los campos del frontend a los del modelo
    if (updateData.nombreEmpresa !== undefined) dataToUpdate.nombreEmpresa = updateData.nombreEmpresa;
    if (updateData.razonSocial !== undefined) dataToUpdate.razonSocial = updateData.razonSocial;
    if (updateData.direccion !== undefined) dataToUpdate.direccion = updateData.direccion;
    if (updateData.telefono !== undefined) dataToUpdate.telefono = updateData.telefono;
    if (updateData.email !== undefined) dataToUpdate.email = updateData.email;
    if (updateData.sitioWeb !== undefined) dataToUpdate.sitioWeb = updateData.sitioWeb;
    if (updateData.rfc !== undefined) dataToUpdate.rfc = updateData.rfc;
    if (updateData.logo !== undefined) dataToUpdate.logo = updateData.logo;
    if (updateData.mostrarLogo !== undefined) dataToUpdate.mostrarLogo = updateData.mostrarLogo;
    if (updateData.tamañoLogo !== undefined) dataToUpdate.tamañoLogo = updateData.tamañoLogo;
    if (updateData.redesSociales?.facebook !== undefined) dataToUpdate.redesSocialesFacebook = updateData.redesSociales.facebook;
    if (updateData.redesSociales?.instagram !== undefined) dataToUpdate.redesSocialesInstagram = updateData.redesSociales.instagram;
    if (updateData.redesSociales?.twitter !== undefined) dataToUpdate.redesSocialesTwitter = updateData.redesSociales.twitter;
    if (updateData.redesSociales?.linkedin !== undefined) dataToUpdate.redesSocialesLinkedin = updateData.redesSociales.linkedin;
    if (updateData.redesSociales?.whatsapp !== undefined) dataToUpdate.redesSocialesWhatsapp = updateData.redesSociales.whatsapp;
    if (updateData.mostrarRedesSociales !== undefined) dataToUpdate.mostrarRedesSociales = updateData.mostrarRedesSociales;
    if (updateData.textos?.encabezado !== undefined) dataToUpdate.textoEncabezado = updateData.textos.encabezado;
    if (updateData.textos?.piePagina !== undefined) dataToUpdate.textoPiePagina = updateData.textos.piePagina;
    if (updateData.textos?.mensajeEspecial !== undefined) dataToUpdate.mensajeEspecial = updateData.textos.mensajeEspecial;
    if (updateData.textos?.mostrarMensaje !== undefined) dataToUpdate.mostrarMensajeEspecial = updateData.textos.mostrarMensaje;
    if (updateData.diseño?.mostrarFecha !== undefined) dataToUpdate.mostrarFecha = updateData.diseño.mostrarFecha;
    if (updateData.diseño?.mostrarHora !== undefined) dataToUpdate.mostrarHora = updateData.diseño.mostrarHora;
    if (updateData.diseño?.mostrarCajero !== undefined) dataToUpdate.mostrarCajero = updateData.diseño.mostrarCajero;
    if (updateData.diseño?.mostrarCliente !== undefined) dataToUpdate.mostrarCliente = updateData.diseño.mostrarCliente;
    if (updateData.diseño?.colorPrincipal !== undefined) dataToUpdate.colorPrincipal = updateData.diseño.colorPrincipal;
    if (updateData.diseño?.alineacion !== undefined) dataToUpdate.alineacion = updateData.diseño.alineacion;
    if (updateData.activo !== undefined) dataToUpdate.activo = updateData.activo;
    if (updateData.urlQR !== undefined) dataToUpdate.urlQR = updateData.urlQR && String(updateData.urlQR).trim() ? updateData.urlQR.trim() : null;

    // Si no existe, crearla
    if (!configuracion) {
      configuracion = await prisma.configuracionTicket.create({
        data: {
          tipoTicket,
          nombreEmpresa: updateData.nombreEmpresa || 'Mi Empresa S.A. de C.V.',
          razonSocial: updateData.razonSocial || null,
          direccion: updateData.direccion || null,
          telefono: updateData.telefono || null,
          email: updateData.email || null,
          sitioWeb: updateData.sitioWeb || null,
          rfc: updateData.rfc || null,
          logo: updateData.logo || null,
          mostrarLogo: updateData.mostrarLogo !== undefined ? updateData.mostrarLogo : true,
          tamañoLogo: updateData.tamañoLogo || 'mediano',
          redesSocialesFacebook: updateData.redesSociales?.facebook || null,
          redesSocialesInstagram: updateData.redesSociales?.instagram || null,
          redesSocialesTwitter: updateData.redesSociales?.twitter || null,
          redesSocialesLinkedin: updateData.redesSociales?.linkedin || null,
          redesSocialesWhatsapp: updateData.redesSociales?.whatsapp || null,
          mostrarRedesSociales: updateData.mostrarRedesSociales !== undefined ? updateData.mostrarRedesSociales : true,
          textoEncabezado: updateData.textos?.encabezado || null,
          textoPiePagina: updateData.textos?.piePagina || null,
          mensajeEspecial: updateData.textos?.mensajeEspecial || null,
          mostrarMensajeEspecial: updateData.textos?.mostrarMensaje !== undefined ? updateData.textos.mostrarMensaje : false,
          mostrarFecha: updateData.diseño?.mostrarFecha !== undefined ? updateData.diseño.mostrarFecha : true,
          mostrarHora: updateData.diseño?.mostrarHora !== undefined ? updateData.diseño.mostrarHora : true,
          mostrarCajero: updateData.diseño?.mostrarCajero !== undefined ? updateData.diseño.mostrarCajero : true,
          mostrarCliente: updateData.diseño?.mostrarCliente !== undefined ? updateData.diseño.mostrarCliente : true,
          colorPrincipal: updateData.diseño?.colorPrincipal || '#1976d2',
          alineacion: updateData.diseño?.alineacion || 'centro',
          urlQR: updateData.urlQR && String(updateData.urlQR).trim() ? updateData.urlQR.trim() : null,
          activo: updateData.activo !== undefined ? updateData.activo : true
        }
      });
    } else {
      // Actualizar la configuración existente
      configuracion = await prisma.configuracionTicket.update({
        where: { tipoTicket },
        data: dataToUpdate
      });
    }

    return configuracion;
  } catch (error) {
    // Si la tabla no existe, retornar configuración por defecto en lugar de lanzar error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      console.warn(`Tabla configuracion_tickets no existe aún para tipo ${tipoTicket}. Ejecuta la migración de Prisma. Retornando configuración por defecto.`);
      return {
        id: '',
        tipoTicket,
        nombreEmpresa: updateData.nombreEmpresa || 'Mi Empresa S.A. de C.V.',
        razonSocial: updateData.razonSocial || null,
        direccion: updateData.direccion || null,
        telefono: updateData.telefono || null,
        email: updateData.email || null,
        sitioWeb: updateData.sitioWeb || null,
        rfc: updateData.rfc || null,
        logo: updateData.logo || null,
        mostrarLogo: updateData.mostrarLogo !== undefined ? updateData.mostrarLogo : true,
        tamañoLogo: updateData.tamañoLogo || 'mediano',
        redesSocialesFacebook: updateData.redesSociales?.facebook || null,
        redesSocialesInstagram: updateData.redesSociales?.instagram || null,
        redesSocialesTwitter: updateData.redesSociales?.twitter || null,
        redesSocialesLinkedin: updateData.redesSociales?.linkedin || null,
        redesSocialesWhatsapp: updateData.redesSociales?.whatsapp || null,
        mostrarRedesSociales: updateData.mostrarRedesSociales !== undefined ? updateData.mostrarRedesSociales : true,
        textoEncabezado: updateData.textos?.encabezado || null,
        textoPiePagina: updateData.textos?.piePagina || null,
        mensajeEspecial: updateData.textos?.mensajeEspecial || null,
        mostrarMensajeEspecial: updateData.textos?.mostrarMensaje !== undefined ? updateData.textos.mostrarMensaje : false,
        mostrarFecha: updateData.diseño?.mostrarFecha !== undefined ? updateData.diseño.mostrarFecha : true,
        mostrarHora: updateData.diseño?.mostrarHora !== undefined ? updateData.diseño.mostrarHora : true,
        mostrarCajero: updateData.diseño?.mostrarCajero !== undefined ? updateData.diseño.mostrarCajero : true,
        mostrarCliente: updateData.diseño?.mostrarCliente !== undefined ? updateData.diseño.mostrarCliente : true,
        colorPrincipal: updateData.diseño?.colorPrincipal || '#1976d2',
        alineacion: updateData.diseño?.alineacion || 'centro',
        activo: updateData.activo !== undefined ? updateData.activo : true,
        fechaCreacion: new Date(),
        fechaModificacion: new Date()
      };
    }
    throw error;
  }
};

