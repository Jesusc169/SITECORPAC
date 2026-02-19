import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto") as File;

    if (!file)
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    if (!file.type.startsWith("image/"))
      return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanName = file.name.replace(/\s+/g, "_");
    const fileName = `directorio-${Date.now()}-${cleanName}`;

    // 🔥 RUTA REAL DEL PROYECTO
    const uploadDir = path.join(process.cwd(), "public/uploads/directorio");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const urlPublica = `/uploads/directorio/${fileName}`;

    console.log("Imagen guardada en:", filePath);

    return NextResponse.json({
      ok: true,
      url: urlPublica,
      nombre: fileName,
    });
  } catch (error) {
    console.error("ERROR SUBIENDO IMAGEN:", error);
    return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
  }
}
