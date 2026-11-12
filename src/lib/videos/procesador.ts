/**
 * Comprime los videos subidos, de a uno, en segundo plano.
 *
 * Arranca con el servidor (src/instrumentation.ts) y cada pocos segundos
 * busca un video PENDIENTE. Con PM2 hay 2 procesos del sitio: cada uno
 * "reclama" el video con un UPDATE condicionado (solo uno gana) y, si ya hay
 * otro comprimiéndose, espera su turno: el VPS tiene 2 núcleos y ffmpeg corre
 * con la prioridad más baja para no frenar el sitio.
 *
 * Si el proceso se reinicia a mitad (un deploy), el video queda PROCESANDO
 * sin "latido": a los 2 minutos vuelve a PENDIENTE y se reintenta (3 veces).
 */
import path from "path";
import { randomBytes, createHmac } from "crypto";
import { mkdir, stat } from "fs/promises";
import prisma from "@/lib/prisma";
import { MAX_VIDEO_SEGUNDOS } from "@/lib/constantesArchivos";
import {
  argumentosCompresion,
  argumentosPortada,
  argumentosSonda,
  ejecutar as ejecutarReal,
  interpretarSonda,
  progresoDeLinea,
  programaFfmpeg,
  programaFfprobe,
  segundoPortada,
  type Ejecutor,
} from "@/lib/videos/ffmpeg";
import { borrarArchivo, carpetaPublica, rutaOriginal, URL_VIDEOS } from "@/lib/videos/almacen";
import { limpiarVideos } from "@/lib/videos/limpieza";

export const LATIDO_VENCIDO_MS = 2 * 60 * 1000;
export const MAX_INTENTOS = 3;

/** Mensajes que ve la secretaría cuando algo sale mal. */
export const MENSAJES = {
  noEsVideo: "El archivo no se pudo leer como video. Prueba con otro archivo (MP4 o MOV).",
  muyLargo: (min: number) =>
    `El video dura ${min} minutos y el máximo es ${MAX_VIDEO_SEGUNDOS / 60}. Recórtalo en el celular y vuelve a subirlo.`,
  sinOriginal: "Se perdió el archivo subido. Vuelve a subir el video.",
  fallo: "No se pudo comprimir el video. Vuelve a subirlo; si se repite, avisa al encargado de la página.",
  sinPrograma: "El servidor no tiene instalado el programa de video (ffmpeg). Avisa al encargado de la página.",
} as const;

/** Clave con la que el procesador le pide al sitio que refresque sus páginas. */
export function claveInterna(): string {
  return createHmac("sha256", process.env.JWT_SECRET ?? "").update("videos-listos").digest("hex");
}

/** Refresca noticias, ferias y sorteos públicos (revalidateTag solo funciona dentro de una ruta). */
export async function avisarAlSitio(f: typeof fetch = fetch): Promise<void> {
  try {
    await f(`http://127.0.0.1:${process.env.PORT || 3000}/api/interno/videos`, {
      method: "POST",
      headers: { "x-clave-interna": claveInterna() },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Si no responde, las páginas se refrescan solas al minuto (revalidate 60)
  }
}

/** Devuelve a la cola los videos que quedaron a medias por un reinicio. */
export async function recuperarAbandonados(ahora = new Date()): Promise<void> {
  const limite = new Date(ahora.getTime() - LATIDO_VENCIDO_MS);
  const abandonados = { estado: "PROCESANDO" as const, OR: [{ latido: null }, { latido: { lt: limite } }] };
  await prisma.video.updateMany({
    where: { ...abandonados, intentos: { gte: MAX_INTENTOS } },
    data: { estado: "ERROR", error: MENSAJES.fallo, latido: null },
  });
  await prisma.video.updateMany({ where: abandonados, data: { estado: "PENDIENTE", progreso: 0, latido: null } });
}

/** Toma el siguiente video de la cola; null si no hay o si otro ya está trabajando. */
export async function reclamarSiguiente(ahora = new Date()) {
  const ocupado = await prisma.video.count({
    where: { estado: "PROCESANDO", latido: { gte: new Date(ahora.getTime() - LATIDO_VENCIDO_MS) } },
  });
  if (ocupado) return null;
  const siguiente = await prisma.video.findFirst({ where: { estado: "PENDIENTE" }, orderBy: { id: "asc" } });
  if (!siguiente) return null;
  const { count } = await prisma.video.updateMany({
    where: { id: siguiente.id, estado: "PENDIENTE" },
    data: { estado: "PROCESANDO", latido: ahora, progreso: 0, intentos: { increment: 1 } },
  });
  return count === 1 ? siguiente : null;
}

async function marcarError(id: number, mensaje: string, original: string | null) {
  await prisma.video.update({
    where: { id },
    data: { estado: "ERROR", error: mensaje, latido: null, original: null, procesado_en: new Date() },
  });
  await borrarArchivo(rutaOriginal(original));
}

/** Programa no encontrado: spawn falla con ENOENT y no hay código de salida. */
const faltaPrograma = (r: { codigo: number | null; errores: string }) => r.codigo === null && /ENOENT/.test(r.errores);

/** Comprime UN video ya reclamado. Nunca lanza: los problemas quedan en video.error. */
export async function comprimir(
  video: { id: number; original: string | null },
  ejecutar: Ejecutor = ejecutarReal
): Promise<"LISTO" | "ERROR"> {
  const entrada = rutaOriginal(video.original);
  try {
    if (!entrada || !(await stat(entrada).catch(() => null))) {
      await marcarError(video.id, MENSAJES.sinOriginal, video.original);
      return "ERROR";
    }

    const sonda = await ejecutar(programaFfprobe(), argumentosSonda(entrada), { limiteMs: 60_000 });
    if (faltaPrograma(sonda)) {
      await marcarError(video.id, MENSAJES.sinPrograma, video.original);
      return "ERROR";
    }
    const info = sonda.codigo === 0 ? interpretarSonda(sonda.salida) : null;
    if (!info || info.duracion <= 0) {
      await marcarError(video.id, MENSAJES.noEsVideo, video.original);
      return "ERROR";
    }
    if (info.duracion > MAX_VIDEO_SEGUNDOS + 1) {
      await marcarError(video.id, MENSAJES.muyLargo(Math.ceil(info.duracion / 60)), video.original);
      return "ERROR";
    }

    const carpeta = carpetaPublica();
    await mkdir(carpeta, { recursive: true });
    // Nombre al azar: no se puede adivinar la URL de un video aún no publicado
    const base = `${video.id}-${randomBytes(6).toString("hex")}`;
    const mp4 = path.join(carpeta, `${base}.mp4`);
    const jpg = path.join(carpeta, `${base}.jpg`);

    let ultimoAviso = 0;
    const alLeerLinea = (linea: string) => {
      const p = progresoDeLinea(linea, info.duracion);
      const ahora = Date.now();
      if (p === null || ahora - ultimoAviso < 3000) return;
      ultimoAviso = ahora;
      prisma.video.update({ where: { id: video.id }, data: { progreso: p, latido: new Date() } }).catch(() => {});
    };

    let r = await ejecutar(programaFfmpeg(), argumentosCompresion(entrada, mp4, info), { alLeerLinea });
    if (r.codigo !== 0 && info.hdr) {
      // Si este ffmpeg no trae el filtro para pasar HDR a SDR, se comprime igual sin él
      r = await ejecutar(programaFfmpeg(), argumentosCompresion(entrada, mp4, { ...info, hdr: false }), { alLeerLinea });
    }
    if (r.codigo !== 0) {
      console.error(`Video ${video.id}: ffmpeg terminó con código ${r.codigo}\n${r.errores}`);
      await borrarArchivo(mp4);
      await marcarError(video.id, faltaPrograma(r) ? MENSAJES.sinPrograma : MENSAJES.fallo, video.original);
      return "ERROR";
    }

    const portada = await ejecutar(programaFfmpeg(), argumentosPortada(mp4, jpg, segundoPortada(info.duracion)), { limiteMs: 60_000 });
    const { size } = await stat(mp4);

    await prisma.video.update({
      where: { id: video.id },
      data: {
        estado: "LISTO",
        progreso: 100,
        url: URL_VIDEOS + `${base}.mp4`,
        poster: portada.codigo === 0 ? URL_VIDEOS + `${base}.jpg` : null,
        bytes: size,
        duracion: Math.round(info.duracion),
        ancho: info.ancho,
        alto: info.alto,
        original: null,
        error: null,
        latido: null,
        procesado_en: new Date(),
      },
    });
    await borrarArchivo(entrada);
    return "LISTO";
  } catch (e) {
    console.error(`Video ${video.id}: error al comprimir`, e);
    await marcarError(video.id, MENSAJES.fallo, video.original).catch(() => {});
    return "ERROR";
  }
}

/** Una vuelta de la cola: recupera abandonados y comprime el siguiente, si hay. */
export async function procesarCola(ejecutar?: Ejecutor, avisar: () => Promise<void> = avisarAlSitio): Promise<boolean> {
  await recuperarAbandonados();
  const video = await reclamarSiguiente();
  if (!video) return false;
  const estado = await comprimir(video, ejecutar);
  if (estado === "LISTO") await avisar();
  return true;
}

const PAUSA_MS = 5000;
const LIMPIEZA_MS = 30 * 60 * 1000;

/**
 * Bucle del procesador (uno por proceso del sitio). No hace nada en el
 * `next build`, ni si VIDEOS_PROCESADOR=0.
 */
export function iniciarProcesador(): boolean {
  const g = globalThis as { __procesadorVideos?: boolean };
  if (g.__procesadorVideos || process.env.VIDEOS_PROCESADOR === "0") return false;
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  g.__procesadorVideos = true;

  const estado = { ultimaLimpieza: 0 };
  const programar = () => {
    setTimeout(() => void vueltaDelProcesador(estado).then(programar), PAUSA_MS).unref();
  };
  programar();
  return true;
}

/** Una vuelta: cada media hora limpia lo que sobra; después vacía la cola. Nunca lanza. */
export async function vueltaDelProcesador(estado: { ultimaLimpieza: number }, ahora = Date.now()): Promise<void> {
  try {
    if (ahora - estado.ultimaLimpieza > LIMPIEZA_MS) {
      estado.ultimaLimpieza = ahora;
      await limpiarVideos();
    }
    // Si comprimió uno, revisa enseguida si hay otro en la cola
    while (await procesarCola());
  } catch (e) {
    console.error("Procesador de videos:", e);
  }
}
