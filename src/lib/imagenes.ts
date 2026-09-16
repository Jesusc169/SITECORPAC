import sharp from "sharp";

const ANCHO_MAXIMO = 1600;

/**
 * Redimensiona y comprime una imagen subida por el admin antes de guardarla
 * en disco. Las fotos de celular/WhatsApp llegan sin comprimir (2-3MB a
 * resoluciones que no necesita ninguna tarjeta del sitio), y como esas
 * imágenes se sirven directo (sin pasar por el optimizador de Next, ver
 * next.config.ts), el peso del archivo en disco es literalmente lo que
 * descarga el visitante.
 */
export async function optimizarImagen(buffer: Buffer): Promise<Buffer> {
  try {
    const imagen = sharp(buffer).rotate(); // corrige la orientación EXIF de fotos de celular
    const metadata = await imagen.metadata();

    const procesada =
      metadata.width && metadata.width > ANCHO_MAXIMO
        ? imagen.resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
        : imagen;

    switch (metadata.format) {
      case "jpeg":
        return await procesada.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      case "png":
        return await procesada.png({ quality: 80, compressionLevel: 9 }).toBuffer();
      case "webp":
        return await procesada.webp({ quality: 78 }).toBuffer();
      default:
        return await procesada.toBuffer();
    }
  } catch {
    // si algo falla (formato raro, archivo corrupto), se guarda el original sin tocar
    return buffer;
  }
}
