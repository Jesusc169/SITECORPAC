import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs"; // necesario para usar fs

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limpiar nombre y generar único
    const cleanName = file.name.replace(/\s+/g, "_");
    const fileName = `${Date.now()}-${cleanName}`;

    // Carpeta de producción
    const uploadDir = path.join("/var/www/sitecorpac/uploads/directorio");

    // Asegurar que la carpeta exista
    await mkdir(uploadDir, { recursive: true });

    // Ruta final del archivo
    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo
    await writeFile(filePath, buffer);

    // URL pública que se guardará en la BD
    const urlPublica = `/uploads/directorio/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: urlPublica,
      nombre: fileName,
    });
  } catch (error) {
    console.error("ERROR SUBIENDO IMAGEN:", error);
    return NextResponse.json(
      { error: "Error subiendo imagen" },
      { status: 500 }
    );
  }
}
