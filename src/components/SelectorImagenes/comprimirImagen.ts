"use client";

/**
 * Achica y comprime una foto EN EL NAVEGADOR antes de subirla.
 *
 * El servidor ya la deja en máx. 1600 px de ancho (lib/imagenes.ts), pero
 * antes de eso la foto viajaba completa por el internet de la secretaria:
 * un PNG de 1.6 MB por cada foto, por cada clic. Con internet lento eso
 * hacía que el guardado se quedara colgado (incidente del 13-nov-2026).
 * Aquí se hace lo mismo que hará el servidor, pero antes de subir: una foto
 * de 1-3 MB baja a unos 100-400 KB.
 *
 * Si algo falla (navegador antiguo, formato raro) se devuelve el archivo
 * original sin tocar: el servidor lo sigue procesando igual que antes.
 */
const ANCHO_MAXIMO = 1600; // igual que lib/imagenes.ts
const CALIDAD = 0.85;
const NO_VALE_LA_PENA_BYTES = 300 * 1024; // fotos chicas se suben tal cual
const TIPOS_COMPRIMIBLES = new Set(["image/jpeg", "image/png", "image/webp"]);

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, CALIDAD));
}

function cambiarExtension(nombre: string, extension: string): string {
  const base = nombre.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.${extension}`;
}

export async function comprimirImagen(file: File): Promise<File> {
  if (!TIPOS_COMPRIMIBLES.has(file.type) || file.size <= NO_VALE_LA_PENA_BYTES) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    // imageOrientation: respeta la rotación EXIF de las fotos de celular.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const escala = bitmap.width > ANCHO_MAXIMO ? ANCHO_MAXIMO / bitmap.width : 1;
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    // WEBP conserva transparencias y pesa poco. Si el navegador no sabe
    // generarlo (Safari antiguo devuelve PNG), se usa JPG con fondo blanco.
    let blob = await aBlob(canvas, "image/webp");
    let extension = "webp";
    if (blob?.type !== "image/webp") {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ancho, alto);
      blob = await aBlob(canvas, "image/jpeg");
      extension = "jpg";
    }
    bitmap.close();

    // Si por algún motivo no quedó más liviana, se sube la original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], cambiarExtension(file.name, extension), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
