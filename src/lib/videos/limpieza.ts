/**
 * Libera espacio: borra los videos que ya nadie usa.
 *
 * Un video queda "huérfano" cuando la secretaría lo sube pero cierra el
 * formulario sin guardar, cuando lo cambia por otro, o cuando la noticia /
 * feria / sorteo sale de la papelera a los 30 días. Se borra (archivo y
 * fila) si no lo usa ningún registro NI ninguna entrada de la papelera, y
 * tiene más de 24 horas (margen para un formulario que sigue abierto).
 *
 * También borra archivos sueltos en las carpetas de videos que no figuran
 * en la base (por ejemplo, una subida cortada a la mitad).
 */
import path from "path";
import { readdir, stat } from "fs/promises";
import prisma from "@/lib/prisma";
import { borrarArchivo as borrar, carpetaOriginales, carpetaPublica, rutaDeUrl, rutaOriginal } from "@/lib/videos/almacen";

export const MARGEN_HUERFANOS_MS = 24 * 60 * 60 * 1000;

/** Ids de video que siguen en uso (registros vivos + papelera). */
export async function videosEnUso(): Promise<Set<number>> {
  const [n, f, s, papelera] = await Promise.all([
    prisma.noticia.findMany({ where: { video_id: { not: null } }, select: { video_id: true } }),
    prisma.evento_feria.findMany({ where: { video_id: { not: null } }, select: { video_id: true } }),
    prisma.sorteo.findMany({ where: { video_id: { not: null } }, select: { video_id: true } }),
    prisma.papelera.findMany({ select: { datos: true } }),
  ]);
  const ids = new Set<number>();
  for (const x of [...n, ...f, ...s]) ids.add(x.video_id!);
  for (const p of papelera) {
    const id = (p.datos as { video_id?: unknown } | null)?.video_id;
    if (typeof id === "number") ids.add(id);
  }
  return ids;
}

async function archivosViejos(carpeta: string, antesDe: number): Promise<string[]> {
  const entradas = await readdir(carpeta, { withFileTypes: true }).catch(() => []);
  const viejos: string[] = [];
  for (const e of entradas) {
    if (!e.isFile()) continue;
    if ((await stat(path.join(carpeta, e.name))).mtimeMs < antesDe) viejos.push(e.name);
  }
  return viejos;
}

/** Devuelve cuántos videos y archivos sueltos borró. */
export async function limpiarVideos(ahora = Date.now()): Promise<{ videos: number; archivos: number }> {
  const antesDe = ahora - MARGEN_HUERFANOS_MS;
  const enUso = await videosEnUso();
  const candidatos = await prisma.video.findMany({
    where: { creado_en: { lt: new Date(antesDe) }, estado: { not: "PROCESANDO" } },
    select: { id: true, url: true, poster: true, original: true },
  });

  let videos = 0;
  for (const v of candidatos) {
    if (enUso.has(v.id)) continue;
    await prisma.video.delete({ where: { id: v.id } }).catch(() => null);
    await borrar(rutaDeUrl(v.url));
    await borrar(rutaDeUrl(v.poster));
    await borrar(rutaOriginal(v.original));
    videos++;
  }

  // Archivos que ninguna fila conoce
  const filas = await prisma.video.findMany({ select: { url: true, poster: true, original: true } });
  const conocidos = new Set<string>();
  for (const f of filas) {
    for (const u of [f.url, f.poster]) if (u) conocidos.add(path.basename(u));
    if (f.original) conocidos.add(f.original);
  }
  let archivos = 0;
  for (const carpeta of [carpetaPublica(), carpetaOriginales()]) {
    for (const nombre of await archivosViejos(carpeta, antesDe)) {
      if (conocidos.has(nombre)) continue;
      await borrar(path.join(carpeta, nombre));
      archivos++;
    }
  }
  return { videos, archivos };
}
