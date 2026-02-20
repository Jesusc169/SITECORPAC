import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* =====================================================
   GET → Listar todas las noticias (admin)
===================================================== */
export async function GET() {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST → Crear nueva noticia (con imagen)
===================================================== */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const contenido = formData.get("contenido") as string;
    const autor = formData.get("autor") as string;
    const imagenFile = formData.get("imagen") as File | null;

    if (!titulo || !descripcion || !autor) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    let imagenPath: string | null = null;

    /* ===============================
       Guardar imagen en /uploads/noticias
    =============================== */
    if (imagenFile && imagenFile.size > 0) {

      if (!imagenFile.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "Solo se permiten imágenes" },
          { status: 400 }
        );
      }

      if (imagenFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { message: "La imagen no puede superar 2MB" },
          { status: 400 }
        );
      }

      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo =
        `noticia-${Date.now()}-${imagenFile.name.replace(/\s+/g, "_")}`;

      const uploadDir = "/var/www/sitecorpac/uploads/noticias";

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);

      await writeFile(filePath, buffer);

      imagenPath = `/uploads/noticias/${nombreArchivo}`;
    }

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        descripcion,
        contenido: contenido || null,
        imagen: imagenPath,
        fecha: new Date(),
        autor,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(nuevaNoticia, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear la noticia" },
      { status: 500 }
    );
  }
}