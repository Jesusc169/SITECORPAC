/**
 * Recibe el archivo de video tal como lo manda el navegador (el cuerpo de la
 * petición ES el archivo, sin multipart) y lo escribe al disco a medida que
 * llega: un video de 800 MB nunca se carga entero en memoria.
 *
 * Importante: esta ruta está excluida del middleware (middleware.ts), porque
 * con middleware Next.js copia el cuerpo en memoria y lo corta a los 10 MB.
 */
import path from "path";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { mkdir, open } from "fs/promises";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import prisma from "@/lib/prisma";
import { MAX_VIDEO_BYTES, EXTENSIONES_VIDEO } from "@/lib/constantesArchivos";
import { borrarArchivo, carpetaOriginales, verificarEspacio, VideoError } from "@/lib/videos/almacen";

/** MP4/MOV/3GP/M4V, MKV/WEBM o AVI, mirando los primeros bytes (no la extensión). */
export function pareceVideo(cabecera: Buffer): boolean {
  if (cabecera.length < 12) return false;
  const caja = cabecera.toString("latin1", 4, 8);
  if (["ftyp", "moov", "mdat", "wide", "free", "skip"].includes(caja)) return true;
  if (cabecera.readUInt32BE(0) === 0x1a45dfa3) return true;
  return cabecera.toString("latin1", 0, 4) === "RIFF" && cabecera.toString("latin1", 8, 12) === "AVI ";
}

export function extensionValida(nombre: string): boolean {
  return EXTENSIONES_VIDEO.includes(path.extname(nombre).toLowerCase());
}

/** Nombre original del archivo (cabecera X-Nombre-Archivo, codificada con encodeURIComponent). */
export function nombreDeCabecera(valor: string | null): string {
  let nombre = "";
  try {
    nombre = decodeURIComponent(valor ?? "");
  } catch {
    nombre = "";
  }
  return path.basename(nombre.replace(/\\/g, "/")).slice(0, 200).trim();
}

async function leerCabecera(ruta: string): Promise<Buffer> {
  const f = await open(ruta, "r");
  try {
    const b = Buffer.alloc(12);
    const { bytesRead } = await f.read(b, 0, 12, 0);
    return b.subarray(0, bytesRead);
  } finally {
    await f.close();
  }
}

export async function recibirVideo(request: Request, subidoPorId: number) {
  const nombre = nombreDeCabecera(request.headers.get("x-nombre-archivo"));
  if (!nombre || !extensionValida(nombre)) {
    throw new VideoError("Ese archivo no es un video. Usa un video MP4 o MOV (los que graba el celular).");
  }
  const tamano = Number(request.headers.get("content-length"));
  if (!Number.isFinite(tamano) || tamano <= 0) throw new VideoError("No llegó el video. Vuelve a intentarlo.");
  if (tamano > MAX_VIDEO_BYTES) {
    throw new VideoError("El video pesa más de 1 GB. Graba en 1080p (no en 4K) o recórtalo en el celular.");
  }
  if (!request.body) throw new VideoError("No llegó el video. Vuelve a intentarlo.");
  await verificarEspacio(tamano);

  const carpeta = carpetaOriginales();
  await mkdir(carpeta, { recursive: true });
  const archivo = `${randomUUID()}${path.extname(nombre).toLowerCase()}`;
  const ruta = path.join(carpeta, archivo);

  let recibidos = 0;
  const contador = new Transform({
    transform(trozo: Buffer, _codificacion, listo) {
      recibidos += trozo.length;
      if (recibidos > tamano) listo(new VideoError("El video llegó más grande de lo anunciado."));
      else listo(null, trozo);
    },
  });

  const destino = createWriteStream(ruta);
  try {
    await pipeline(Readable.fromWeb(request.body as import("stream/web").ReadableStream), contador, destino);
    if (recibidos !== tamano) throw new VideoError("La subida se cortó antes de terminar. Revisa tu internet y vuelve a intentarlo.");
    if (!pareceVideo(await leerCabecera(ruta))) {
      throw new VideoError("Ese archivo no es un video. Usa un video MP4 o MOV (los que graba el celular).");
    }
    return await prisma.video.create({
      data: { nombre_original: nombre, original: archivo, bytes_original: recibidos, subido_por_id: subidoPorId },
      select: { id: true, estado: true, nombre_original: true, bytes_original: true },
    });
  } catch (e) {
    await borrarArchivo(ruta);
    if (e instanceof VideoError) throw e;
    // Se cortó la conexión a mitad de la subida
    if (recibidos < tamano) throw new VideoError("La subida se cortó antes de terminar. Revisa tu internet y vuelve a intentarlo.");
    throw e;
  }
}
