import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function guardarImagenSorteo(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "sorteos");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/sorteos/${fileName}`;
}
