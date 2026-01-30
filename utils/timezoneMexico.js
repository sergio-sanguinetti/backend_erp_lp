/**
 * Utilidad para fechas en zona horaria de Ciudad de México (America/Mexico_City).
 * México no usa horario de verano desde 2022, por lo que la zona es fija UTC-6.
 */

const TIMEZONE_MEXICO = 'America/Mexico_City';

/**
 * Obtiene la fecha de hoy (YYYY-MM-DD) en Ciudad de México.
 * @returns {string} Ej: "2025-01-28"
 */
function getTodayDateMexico() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE_MEXICO });
}

/**
 * Dado un string de fecha YYYY-MM-DD, devuelve el inicio y fin de ese día en Ciudad de México
 * como instantes UTC (Date) para comparar con campos DateTime de la BD.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD (se interpreta como día en México)
 * @returns {{ start: Date, end: Date }}
 */
function getMexicoCityDayBounds(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const today = getTodayDateMexico();
    return getMexicoCityDayBounds(today);
  }
  const trimmed = dateStr.trim();
  // Inicio del día en México: 00:00:00.000 (UTC-6) = 06:00:00 UTC
  const start = new Date(`${trimmed}T06:00:00.000Z`);
  // Fin del día en México: 23:59:59.999 (UTC-6) = 05:59:59.999 del día siguiente en UTC
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return { start, end };
}

/**
 * Obtiene el rango "hoy" (inicio y fin del día actual) en Ciudad de México.
 * Útil para resúmenes del día y cortes de caja.
 * @returns {{ start: Date, end: Date, dateStr: string }}
 */
function getTodayBoundsMexico() {
  const dateStr = getTodayDateMexico();
  const { start, end } = getMexicoCityDayBounds(dateStr);
  return { start, end, dateStr };
}

/**
 * Obtiene fecha y hora actual en Ciudad de México para pedidos.
 * @returns {{ dateStr: string, timeStr: string, date: Date }} dateStr YYYY-MM-DD, timeStr HH:MM, date = instante actual
 */
function getNowMexico() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE_MEXICO });
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE_MEXICO, hour: '2-digit', minute: '2-digit', hour12: false });
  return { dateStr, timeStr, date: now };
}

module.exports = {
  TIMEZONE_MEXICO,
  getTodayDateMexico,
  getMexicoCityDayBounds,
  getTodayBoundsMexico,
  getNowMexico,
};
