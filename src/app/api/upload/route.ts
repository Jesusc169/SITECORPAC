import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { verificarSesion } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("foto") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes" },
        { status: 400 }
      );
    }

    // 🔹 Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🔹 Limpiar nombre
    const cleanName = file.name.replace(/\s+/g, "_");
    const fileName = `directorio-${Date.now()}-${cleanName}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "directorio"
    );

    // Crear carpeta si no existe
    await mkdir(uploadDir, { recursive: true });

    // Ruta final
    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo
    await writeFile(filePath, buffer);

    // URL pública
    const urlPublica = `/uploads/directorio/${fileName}`;

    console.log("✅ Imagen guardada en:", filePath);

    return NextResponse.json({
      ok: true,
      url: urlPublica,
      nombre: fileName,
    });
  } catch (error) {
    console.error("❌ ERROR SUBIENDO IMAGEN:", error);
    return NextResponse.json(
      { error: "Error subiendo imagen" },
      { status: 500 }
    );
  }
}
