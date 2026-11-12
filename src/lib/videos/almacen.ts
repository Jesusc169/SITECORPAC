/**
 * Dónde viven los videos y cuánto espacio pueden ocupar.
 *
 *  - Originales (lo que sube la secretaría): `almacen/videos-subidos/`, FUERA
 *    de public/, porque nunca se muestran tal cual. Se borran al terminar de
 *    comprimir.
 *  - Comprimidos + portadas: `public/uploads/videos/`, que nginx sirve directo
 *    desde el disco (igual que las fotos), con soporte para adelantar el video.
 *
 * Límites de espacio (el VPS tiene 100 GB y el sitio usa ~7 GB):
 *  - VIDEOS_CUOTA_GB (20 por defecto): lo máximo que pueden sumar los videos.
 *    A ~8 MB por minuto son más de 40 horas de video.
 *  - VIDEOS_LIBRE_MINIMO_GB (5 por defecto): una subida se rechaza si el
 *    disco quedaría con menos de eso libre (la base de datos, los respaldos
 *    y el sistema siguen necesitando lugar).
 */
import path from "path";
import { statfs, unlink } from "fs/promises";
import prisma from "@/lib/prisma";

const GB = 1024 ** 3;

export class VideoError extends Error {}

export const carpetaOriginales = () =>
  process.env.VIDEOS_TMP_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "almacen", "videos-subidos");

export const carpetaPublica = () => path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads", "videos");

export const URL_VIDEOS = "/uploads/videos/";

/** "/uploads/videos/abc.mp4" → ruta en disco; null si no es una URL de video. */
export function rutaDeUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(URL_VIDEOS)) return null;
  const nombre = url.slice(URL_VIDEOS.length);
  if (!/^[\w.-]+$/.test(nombre) || nombre.includes("..")) return null;
  return path.join(carpetaPublica(), nombre);
}

/** Ruta del original guardado en la columna video.original (solo el nombre). */
export function rutaOriginal(nombre: string | null | undefined): string | null {
  if (!nombre || !/^[\w.-]+$/.test(nombre) || nombre.includes("..")) return null;
  return path.join(carpetaOriginales(), nombre);
}

/** Borra un archivo si existe; si ya no estaba (o no se puede), sigue sin error. */
export async function borrarArchivo(ruta: string | null): Promise<void> {
  if (ruta) await unlink(ruta).catch(() => {});
}

const numeroEnv = (nombre: string, porDefecto: number) => {
  const v = Number(process.env[nombre]);
  return Number.isFinite(v) && v > 0 ? v : porDefecto;
};

export const cuotaBytes = () => numeroEnv("VIDEOS_CUOTA_GB", 20) * GB;
export const libreMinimoBytes = () => numeroEnv("VIDEOS_LIBRE_MINIMO_GB", 5) * GB;

/** Bytes libres del disco donde está la carpeta (o null si no se puede saber). */
export async function libreEnDisco(carpeta = process.cwd()): Promise<number | null> {
  try {
    const s = await statfs(carpeta);
    return Number(s.bavail) * Number(s.bsize);
  } catch {
    return null;
  }
}

export interface Espacio {
  usados: number;
  cuota: number;
  libreDisco: number | null;
  /** Lo más grande que se puede subir ahora mismo. */
  disponible: number;
}

/**
 * Lo que ocupan los videos: los comprimidos, más los originales que todavía
 * esperan su turno (cuentan completos hasta que se comprimen).
 */
export async function espacioVideos(carpetaDisco = process.cwd()): Promise<Espacio> {
  const [listos, pendientes] = await Promise.all([
    prisma.video.aggregate({ _sum: { bytes: true }, where: { estado: "LISTO" } }),
    prisma.video.aggregate({ _sum: { bytes_original: true }, where: { estado: { in: ["PENDIENTE", "PROCESANDO"] } } }),
  ]);
  const usados = (listos._sum.bytes ?? 0) + (pendientes._sum.bytes_original ?? 0);
  const cuota = cuotaBytes();
  const libreDisco = await libreEnDisco(carpetaDisco);
  const porCuota = cuota - usados;
  const porDisco = libreDisco === null ? porCuota : libreDisco - libreMinimoBytes();
  return { usados, cuota, libreDisco, disponible: Math.max(0, Math.min(porCuota, porDisco)) };
}

export function textoTamano(bytes: number): string {
  if (bytes >= GB) return (bytes / GB).toFixed(1).replace(".0", "").replace(".", ",") + " GB";
  return Math.max(1, Math.round(bytes / 1024 ** 2)) + " MB";
}

/** Lanza VideoError si un archivo de ese tamaño no entra. */
export async function verificarEspacio(tamano: number): Promise<void> {
  const e = await espacioVideos();
  if (tamano <= e.disponible) return;
  if (e.cuota - e.usados < tamano) {
    throw new VideoError(
      `Se llegó al límite de espacio para videos (${textoTamano(e.usados)} de ${textoTamano(e.cuota)}). ` +
        "Elimina videos antiguos que ya no hagan falta o avisa al encargado de la página."
    );
  }
  throw new VideoError("El servidor se está quedando sin espacio en disco. Avisa al encargado de la página.");
}
