/**
 * Fechas y horas del SITECORPAC, siempre en hora de Perú.
 *
 * El servidor de producción corre en UTC y los visitantes están en Perú
 * (UTC−5, sin horario de verano). Sin fijar la zona:
 *  - las fechas sin hora (fechas de feria, columnas @db.Date guardadas como
 *    medianoche UTC) se mostraban UN DÍA ANTES en el navegador;
 *  - la hora de un sorteo escrita en el panel se guardaba como si fuera UTC
 *    y se mostraba 5 horas antes.
 */
export const ZONA_PERU = "America/Lima";
const OFFSET_PERU = "-05:00";

/** "2026-03-30" + "19:00" → "2026-03-30T19:00:00-05:00" (instante exacto en hora de Perú). */
export function fechaHoraPeru(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00${OFFSET_PERU}`;
}

/** Fecha y hora de Perú de un instante, para llenar los campos date/time del panel. */
export function partesPeru(valor: string | Date): { fecha: string; hora: string } {
  const d = new Date(valor);
  if (isNaN(d.getTime())) return { fecha: "", hora: "" };
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA_PERU, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** Fecha sin hora (columna @db.Date): se formatea en UTC para no correrse un día. */
export function formatearFechaSola(valor: string | Date, opciones: Intl.DateTimeFormatOptions = {}): string {
  return new Date(valor).toLocaleDateString("es-PE", { ...opciones, timeZone: "UTC" });
}

/** Fecha con hora (instante): se formatea en hora de Perú, esté donde esté el visitante. */
export function formatearFechaHoraPeru(valor: string | Date, opciones: Intl.DateTimeFormatOptions = {}): string {
  return new Date(valor).toLocaleString("es-PE", { ...opciones, timeZone: ZONA_PERU });
}
