import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function guardarImagenFeria(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "ferias");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/ferias/${fileName}`;
}
