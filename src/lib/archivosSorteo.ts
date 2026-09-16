import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { optimizarImagen } from "@/lib/imagenes";
import { validarImagen, nombreArchivoSeguro } from "@/lib/validacionArchivos";

export async function guardarImagenSorteo(file: File): Promise<string> {
  validarImagen(file);

  const original = Buffer.from(await file.arrayBuffer());
  const buffer = await optimizarImagen(original);
  const fileName = `${Date.now()}-${nombreArchivoSeguro(file.name)}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "sorteos");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/sorteos/${fileName}`;
}
