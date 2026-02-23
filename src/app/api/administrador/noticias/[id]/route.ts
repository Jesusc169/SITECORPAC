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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

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

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "images",
        "uploads",
        "noticias"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);
      await writeFile(filePath, buffer);

      if (noticiaActual.imagen) {
        const rutaAnterior = path.join(
          process.cwd(),
          "public",
          noticiaActual.imagen
        );

        try {
          await unlink(rutaAnterior);
        } catch {}
      }

      imagenPath = `/images/uploads/noticias/${nombreArchivo}`;
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

/* =====================================================
   DELETE → Eliminar noticia
===================================================== */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const noticia = await prisma.noticia.findUnique({
      where: { id },
    });

    if (!noticia) {
      return NextResponse.json(
        { message: "Noticia no encontrada" },
        { status: 404 }
      );
    }

    if (noticia.imagen) {
      const rutaImagen = path.join(
        process.cwd(),
        "public",
        noticia.imagen
      );

      try {
        await unlink(rutaImagen);
      } catch {}
    }

    await prisma.noticia.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Noticia eliminada correctamente",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar noticia" },
      { status: 500 }
    );
  }
}