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

    // validar tipo imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // nombre limpio sin espacios
    const cleanName = file.name.replace(/\s+/g, "_");

    // nombre único
    const fileName = `${Date.now()}-${cleanName}`;

    // ruta destino REAL
    const uploadDir = path.join(
      process.cwd(),
      "public/images/sorteos"
    );

    // asegurar carpeta
    await mkdir(uploadDir, { recursive: true });

    // ruta final archivo
    const filePath = path.join(uploadDir, fileName);

    // guardar archivo
    await writeFile(filePath, buffer);

    // url pública que guardarás en BD
    const urlPublica = `/images/sorteos/${fileName}`;

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
