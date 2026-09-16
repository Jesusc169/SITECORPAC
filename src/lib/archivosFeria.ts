import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { optimizarImagen } from "@/lib/imagenes";
import { validarImagen, nombreArchivoSeguro } from "@/lib/validacionArchivos";

export async function guardarImagenFeria(file: File): Promise<string> {
  validarImagen(file);

  const original = Buffer.from(await file.arrayBuffer());
  const buffer = await optimizarImagen(original);
  const fileName = `${Date.now()}-${nombreArchivoSeguro(file.name)}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "ferias");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/ferias/${fileName}`;
}
