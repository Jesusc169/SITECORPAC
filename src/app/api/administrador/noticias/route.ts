import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

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
       Guardar imagen local (public)
    =============================== */
    if (imagenFile && imagenFile.size > 0) {
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo = `${Date.now()}-${imagenFile.name.replace(/\s+/g, "_")}`;
      const rutaImagen = path.join(
        process.cwd(),
        "public/images/noticias",
        nombreArchivo
      );

      await writeFile(rutaImagen, buffer);
      imagenPath = `/images/noticias/${nombreArchivo}`;
    }

    /* ===============================
       Crear noticia en BD
    =============================== */
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
