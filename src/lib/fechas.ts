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

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "14 sep 2026": fecha de publicación de una noticia, en hora de Perú ("" si no es válida). */
export function fechaCorta(valor: string | Date): string {
  const { fecha } = partesPeru(valor);
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return `${dia} ${MESES_CORTOS[mes - 1]} ${anio}`;
}

/** Día de feria (@db.Date, medianoche UTC) → { dia, mes (0-11), anio, semana (0-6) }. */
function partesDia(valor: string | Date) {
  const d = new Date(valor);
  return { dia: d.getUTCDate(), mes: d.getUTCMonth(), anio: d.getUTCFullYear(), semana: d.getUTCDay() };
}

/** "Lun 30 de marzo" (fecha sin hora de una feria). */
export function diaConSemana(valor: string | Date): string {
  const p = partesDia(valor);
  return `${DIAS_CORTOS[p.semana]} ${p.dia} de ${MESES[p.mes]}`;
}

/** Une textos como en castellano: "a", "a y b", "a, b y c". */
function unir(partes: string[]): string {
  return partes.length > 1 ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}` : partes.join("");
}

/**
 * Días de una feria en una frase: "30 y 31 de marzo", "2, 3 y 4 de marzo",
 * "31 de marzo y 1 de abril". Ordena las fechas; "" si no hay ninguna.
 */
export function rangoDias(fechas: (string | Date)[]): string {
  const partes = fechas.map(partesDia).sort((a, b) => a.anio - b.anio || a.mes - b.mes || a.dia - b.dia);
  if (partes.length === 0) return "";
  const mismoMes = partes.every((p) => p.mes === partes[0].mes && p.anio === partes[0].anio);
  if (mismoMes) return `${unir(partes.map((p) => String(p.dia)))} de ${MESES[partes[0].mes]}`;
  return unir(partes.map((p) => `${p.dia} de ${MESES[p.mes]}`));
}

/** ¿Ya pasaron todos los días de la feria? (comparado con la fecha de hoy en Perú). */
export function feriaFinalizada(fechas: (string | Date)[], hoy: Date = new Date()): boolean {
  if (fechas.length === 0) return false;
  const hoyPeru = partesPeru(hoy).fecha;
  return fechas.every((f) => new Date(f).toISOString().slice(0, 10) < hoyPeru);
}
