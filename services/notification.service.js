/**
 * Servicio de notificaciones push con Expo Push API.
 * Envía notificaciones a la app móvil (APP-ERPGASLP-STABLE) cuando se asigna un pedido al repartidor.
 */
const { Expo } = require('expo-server-sdk');

// Crear cliente Expo (accessToken opcional; en producción conviene usar EXPO_ACCESS_TOKEN)
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || null,
  useFcmV1: true,
});

/**
 * Envía una notificación push al repartidor cuando se le asigna un nuevo pedido.
 * @param {string} pushToken - Token Expo del dispositivo (ExponentPushToken[...])
 * @param {object} options - { titulo, cuerpo, pedidoId, numeroPedido }
 * @returns {Promise<object|null>} - Ticket de Expo o null si no se pudo enviar
 */
exports.sendPedidoAsignadoToRepartidor = async (pushToken, options = {}) => {
  if (!pushToken || typeof pushToken !== 'string' || !pushToken.trim()) {
    console.log('[Notification] No hay pushToken, se omite el envío.');
    return null;
  }

  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn('[Notification] Token no es un Expo push token válido:', pushToken?.slice(0, 30) + '...');
    return null;
  }

  const {
    titulo = 'Nuevo pedido asignado',
    cuerpo = 'Tienes un nuevo pedido para entregar.',
    pedidoId,
    numeroPedido,
  } = options;

  const message = {
    to: pushToken,
    sound: 'default',
    title: titulo,
    body: cuerpo,
    data: {
      type: 'nuevo_pedido',
      pedidoId: pedidoId || null,
      numeroPedido: numeroPedido || null,
    },
    channelId: 'pedidos',
    priority: 'high',
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('[Notification] Error Expo:', ticket.message);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // El token ya no es válido; se podría limpiar en el usuario
            console.warn('[Notification] Dispositivo no registrado, considerar limpiar pushToken del usuario.');
          }
        }
        return ticket;
      }
    }
    return null;
  } catch (error) {
    console.error('[Notification] Error al enviar push:', error.message);
    return null;
  }
};
