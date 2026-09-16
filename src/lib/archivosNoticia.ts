import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";

export const MAX_IMAGEN_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENTO_BYTES = 15 * 1024 * 1024;

const TIPOS_DOCUMENTO_PERMITIDOS = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const EXTENSIONES_DOCUMENTO_PERMITIDAS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

export function esImagenValida(file: File): boolean {
  return file.type.startsWith("image/");
}

export function esDocumentoPermitido(file: File): boolean {
  const nombre = file.name.toLowerCase();
  const extensionValida = EXTENSIONES_DOCUMENTO_PERMITIDAS.some((ext) =>
    nombre.endsWith(ext)
  );
  return TIPOS_DOCUMENTO_PERMITIDOS.has(file.type) || extensionValida;
}

export async function guardarImagenNoticia(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const nombreArchivo = `noticia-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "noticias");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, nombreArchivo), buffer);

  return `/uploads/noticias/${nombreArchivo}`;
}

export async function borrarImagenNoticia(imagenUrl: string | null): Promise<void> {
  if (!imagenUrl) return;
  try {
    await unlink(path.join(process.cwd(), "public", imagenUrl));
  } catch {
    // si no existe, no pasa nada
  }
}

export async function guardarDocumentoNoticia(file: File, indice: number): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const nombreArchivo = `noticia-${Date.now()}-${indice}-${file.name.replace(/\s+/g, "_")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "noticias", "pdf");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, nombreArchivo), buffer);

  return `/uploads/noticias/pdf/${nombreArchivo}`;
}

export async function borrarDocumentoNoticia(documentoUrl: string): Promise<void> {
  try {
    await unlink(path.join(process.cwd(), "public", documentoUrl));
  } catch {
    // si no existe, no pasa nada
  }
}
