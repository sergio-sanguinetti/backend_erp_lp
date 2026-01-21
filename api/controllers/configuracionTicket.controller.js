const configuracionTicketService = require('../../services/configuracionTicket.service');

// Obtener todas las configuraciones de tickets
exports.getAllConfiguracionesTicket = async (req, res, next) => {
  try {
    const configuraciones = await configuracionTicketService.getAllConfiguracionesTicket();
    
    // Transformar los datos del modelo a el formato esperado por el frontend
    const configsFormateadas = configuraciones.map(configuracion => ({
      id: configuracion.id,
      tipoTicket: configuracion.tipoTicket,
      nombreEmpresa: configuracion.nombreEmpresa,
      razonSocial: configuracion.razonSocial,
      direccion: configuracion.direccion,
      telefono: configuracion.telefono,
      email: configuracion.email,
      sitioWeb: configuracion.sitioWeb,
      rfc: configuracion.rfc,
      logo: configuracion.logo,
      mostrarLogo: configuracion.mostrarLogo,
      tamañoLogo: configuracion.tamañoLogo,
      redesSociales: {
        facebook: configuracion.redesSocialesFacebook,
        instagram: configuracion.redesSocialesInstagram,
        twitter: configuracion.redesSocialesTwitter,
        linkedin: configuracion.redesSocialesLinkedin,
        whatsapp: configuracion.redesSocialesWhatsapp
      },
      mostrarRedesSociales: configuracion.mostrarRedesSociales,
      textos: {
        encabezado: configuracion.textoEncabezado,
        piePagina: configuracion.textoPiePagina,
        mensajeEspecial: configuracion.mensajeEspecial,
        mostrarMensaje: configuracion.mostrarMensajeEspecial
      },
      diseño: {
        mostrarFecha: configuracion.mostrarFecha,
        mostrarHora: configuracion.mostrarHora,
        mostrarCajero: configuracion.mostrarCajero,
        mostrarCliente: configuracion.mostrarCliente,
        colorPrincipal: configuracion.colorPrincipal,
        alineacion: configuracion.alineacion
      },
      activo: configuracion.activo,
      fechaCreacion: configuracion.fechaCreacion,
      fechaModificacion: configuracion.fechaModificacion
    }));
    
    res.status(200).json(configsFormateadas);
  } catch (error) {
    next(error);
  }
};

// Obtener la configuración de tickets por tipo
exports.getConfiguracionTicket = async (req, res, next) => {
  try {
    const { tipoTicket } = req.query;
    const tipo = tipoTicket || 'venta';
    
    const configuracion = await configuracionTicketService.getConfiguracionTicket(tipo);
    
    // Transformar los datos del modelo a el formato esperado por el frontend
    const configFormateada = {
      id: configuracion.id,
      tipoTicket: configuracion.tipoTicket,
      nombreEmpresa: configuracion.nombreEmpresa,
      razonSocial: configuracion.razonSocial,
      direccion: configuracion.direccion,
      telefono: configuracion.telefono,
      email: configuracion.email,
      sitioWeb: configuracion.sitioWeb,
      rfc: configuracion.rfc,
      logo: configuracion.logo,
      mostrarLogo: configuracion.mostrarLogo,
      tamañoLogo: configuracion.tamañoLogo,
      redesSociales: {
        facebook: configuracion.redesSocialesFacebook,
        instagram: configuracion.redesSocialesInstagram,
        twitter: configuracion.redesSocialesTwitter,
        linkedin: configuracion.redesSocialesLinkedin,
        whatsapp: configuracion.redesSocialesWhatsapp
      },
      mostrarRedesSociales: configuracion.mostrarRedesSociales,
      textos: {
        encabezado: configuracion.textoEncabezado,
        piePagina: configuracion.textoPiePagina,
        mensajeEspecial: configuracion.mensajeEspecial,
        mostrarMensaje: configuracion.mostrarMensajeEspecial
      },
      diseño: {
        mostrarFecha: configuracion.mostrarFecha,
        mostrarHora: configuracion.mostrarHora,
        mostrarCajero: configuracion.mostrarCajero,
        mostrarCliente: configuracion.mostrarCliente,
        colorPrincipal: configuracion.colorPrincipal,
        alineacion: configuracion.alineacion
      },
      activo: configuracion.activo,
      fechaCreacion: configuracion.fechaCreacion,
      fechaModificacion: configuracion.fechaModificacion
    };
    
    res.status(200).json(configFormateada);
  } catch (error) {
    next(error);
  }
};

// Actualizar la configuración de tickets
exports.updateConfiguracionTicket = async (req, res, next) => {
  try {
    console.log('[updateConfiguracionTicket] Petición recibida', {
      user: req.user ? { id: req.user.id, rol: req.user.rol } : 'no user',
      body: req.body ? Object.keys(req.body) : 'no body',
      tipoTicket: req.body?.tipoTicket
    });

    // Verificar permisos - solo administradores pueden actualizar configuraciones
    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // if (req.user && req.user.rol !== 'administrador' && req.user.rol !== 'superAdministrador') {
    //   console.log('[updateConfiguracionTicket] Acceso denegado - rol:', req.user.rol);
    //   return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar la configuración de tickets.' });
    // }

    console.log('[updateConfiguracionTicket] Llamando al servicio...');
    const configuracion = await configuracionTicketService.updateConfiguracionTicket(req.body);
    console.log('[updateConfiguracionTicket] Configuración actualizada exitosamente');
    
    // Transformar los datos del modelo a el formato esperado por el frontend
    const configFormateada = {
      id: configuracion.id,
      tipoTicket: configuracion.tipoTicket,
      nombreEmpresa: configuracion.nombreEmpresa,
      razonSocial: configuracion.razonSocial,
      direccion: configuracion.direccion,
      telefono: configuracion.telefono,
      email: configuracion.email,
      sitioWeb: configuracion.sitioWeb,
      rfc: configuracion.rfc,
      logo: configuracion.logo,
      mostrarLogo: configuracion.mostrarLogo,
      tamañoLogo: configuracion.tamañoLogo,
      redesSociales: {
        facebook: configuracion.redesSocialesFacebook,
        instagram: configuracion.redesSocialesInstagram,
        twitter: configuracion.redesSocialesTwitter,
        linkedin: configuracion.redesSocialesLinkedin,
        whatsapp: configuracion.redesSocialesWhatsapp
      },
      mostrarRedesSociales: configuracion.mostrarRedesSociales,
      textos: {
        encabezado: configuracion.textoEncabezado,
        piePagina: configuracion.textoPiePagina,
        mensajeEspecial: configuracion.mensajeEspecial,
        mostrarMensaje: configuracion.mostrarMensajeEspecial
      },
      diseño: {
        mostrarFecha: configuracion.mostrarFecha,
        mostrarHora: configuracion.mostrarHora,
        mostrarCajero: configuracion.mostrarCajero,
        mostrarCliente: configuracion.mostrarCliente,
        colorPrincipal: configuracion.colorPrincipal,
        alineacion: configuracion.alineacion
      },
      activo: configuracion.activo,
      fechaCreacion: configuracion.fechaCreacion,
      fechaModificacion: configuracion.fechaModificacion
    };
    
    res.status(200).json({
      message: 'Configuración de tickets actualizada exitosamente.',
      configuracion: configFormateada
    });
  } catch (error) {
    next(error);
  }
};

