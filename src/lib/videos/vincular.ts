/**
 * Une un video ya subido a una noticia, feria o sorteo.
 *
 * El formulario del panel sube el video aparte (POST /api/administrador/videos,
 * con barra de progreso) y al guardar manda solo su número:
 *   videoId=12      → usar ese video
 *   quitarVideo=1   → dejar la publicación sin video
 *   (ninguno)       → no cambiar nada
 */
import prisma from "@/lib/prisma";
import { VideoError } from "@/lib/videos/almacen";

/** Lo que el panel necesita saber de un video (sin rutas internas del servidor). */
export const SELECT_VIDEO = {
  select: {
    id: true,
    estado: true,
    progreso: true,
    url: true,
    poster: true,
    bytes: true,
    bytes_original: true,
    duracion: true,
    ancho: true,
    alto: true,
    error: true,
    nombre_original: true,
  },
} as const;

/** undefined = no tocar; null = quitar; número = usar ese video. */
export type CambioVideo = number | null | undefined;

export function cambioVideoDeFormulario(fd: FormData): CambioVideo {
  if (fd.get("quitarVideo")?.toString() === "1") return null;
  const id = Number(fd.get("videoId")?.toString() ?? "");
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

/** Comprueba que el video exista y no haya fallado. Devuelve el valor para video_id. */
export async function validarCambioVideo(
  cambio: CambioVideo,
  error: (mensaje: string) => Error = (m) => new VideoError(m)
): Promise<CambioVideo> {
  if (cambio === undefined || cambio === null) return cambio;
  const v = await prisma.video.findUnique({ where: { id: cambio }, select: { estado: true, error: true } });
  if (!v) throw error("El video ya no está en el servidor. Vuelve a subirlo.");
  if (v.estado === "ERROR") throw error(v.error ?? "Ese video tuvo un problema. Vuelve a subirlo.");
  return cambio;
}

type VideoGuardado = { estado: string; url: string | null; poster: string | null; duracion: number | null; ancho: number | null; alto: number | null } | null | undefined;

/** Para el sitio público: solo los videos ya comprimidos, y solo lo necesario para mostrarlos. */
export function videoPublico(v: VideoGuardado) {
  if (!v || v.estado !== "LISTO" || !v.url) return null;
  return { url: v.url, poster: v.poster, duracion: v.duracion, ancho: v.ancho, alto: v.alto };
}

export type VideoPublico = NonNullable<ReturnType<typeof videoPublico>>;
