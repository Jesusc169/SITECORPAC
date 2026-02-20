import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* =====================================================
   PUT → Actualizar noticia
===================================================== */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const formData = await request.formData();

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const contenido = formData.get("contenido") as string;
    const autor = formData.get("autor") as string;
    const imagenFile = formData.get("imagen") as File | null;

    const noticiaActual = await prisma.noticia.findUnique({
      where: { id },
    });

    if (!noticiaActual) {
      return NextResponse.json(
        { message: "Noticia no encontrada" },
        { status: 404 }
      );
    }

    let imagenPath = noticiaActual.imagen;

    /* ===============================
       Si viene nueva imagen
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
          { message: "Máximo 2MB" },
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

      /* 🔥 Eliminar imagen anterior si existe */
      if (noticiaActual.imagen) {
        const rutaAnterior = path.join(
          "/var/www/sitecorpac",
          noticiaActual.imagen
        );
        try {
          await unlink(rutaAnterior);
        } catch {
          // Si no existe, no pasa nada
        }
      }

      imagenPath = `/uploads/noticias/${nombreArchivo}`;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        contenido: contenido || null,
        autor,
        imagen: imagenPath,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(noticiaActualizada);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar noticia" },
      { status: 500 }
    );
  }
}