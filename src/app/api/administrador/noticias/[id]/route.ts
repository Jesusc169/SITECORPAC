import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/* =====================================================
   GET → Obtener noticia por ID
===================================================== */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
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

    return NextResponse.json(noticia);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener la noticia" },
      { status: 500 }
    );
  }
}

/* =====================================================
   PUT → Actualizar noticia (PRO con imagen)
===================================================== */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    // Detectar si viene FormData o JSON
    const contentType = request.headers.get("content-type") || "";

    let titulo = "";
    let descripcion = "";
    let contenido = "";
    let autor = "";
    let fecha: Date | undefined;
    let imagenUrl: string | undefined;

    /* ===============================
       SI VIENE FORM DATA (con imagen)
    =============================== */
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      titulo = String(formData.get("titulo") || "");
      descripcion = String(formData.get("descripcion") || "");
      contenido = String(formData.get("contenido") || "");
      autor = String(formData.get("autor") || "");

      const fechaStr = formData.get("fecha");
      if (fechaStr) fecha = new Date(String(fechaStr));

      const imagen = formData.get("imagen") as File | null;

      if (imagen && imagen.size > 0) {
        const bytes = await imagen.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${imagen.name.replaceAll(" ", "_")}`;
        const uploadDir = path.join(process.cwd(), "public/uploads");

        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        imagenUrl = `/uploads/${fileName}`;
      }
    }

    /* ===============================
       SI VIENE JSON NORMAL
    =============================== */
    else {
      const body = await request.json();

      titulo = body.titulo;
      descripcion = body.descripcion;
      contenido = body.contenido;
      autor = body.autor;
      fecha = body.fecha ? new Date(body.fecha) : undefined;
      imagenUrl = body.imagen;
    }

    /* ===============================
       UPDATE DB
    =============================== */
    const noticiaActualizada = await prisma.noticia.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        contenido,
        autor,
        ...(fecha && { fecha }),
        ...(imagenUrl && { imagen: imagenUrl }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar la noticia" },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE → Eliminar noticia
===================================================== */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    await prisma.noticia.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar la noticia" },
      { status: 500 }
    );
  }
}
