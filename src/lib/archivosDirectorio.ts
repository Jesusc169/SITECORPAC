import path from "path";
import { promises as fs } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "directorio");

export async function guardarFotoDirectorio(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop();
  const fileName = `directorio-${Date.now()}.${extension}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  return `/uploads/directorio/${fileName}`;
}

export async function borrarFotoDirectorio(fotoUrl: string | null): Promise<void> {
  if (!fotoUrl) return;

  const filePath = path.join(process.cwd(), "public", fotoUrl);
  try {
    await fs.unlink(filePath);
  } catch {
    // si no existe, no pasa nada
  }
}
