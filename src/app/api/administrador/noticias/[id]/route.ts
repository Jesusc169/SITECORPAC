import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =====================================================
   GET → Obtener noticia por ID
===================================================== */
export async function GET(request: Request) {
  try {
    // Obtener ID desde la URL
    const url = new URL(request.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const noticia = await prisma.noticia.findUnique({
      where: { id },
    });

    if (!noticia) {
      return NextResponse.json({ message: "Noticia no encontrada" }, { status: 404 });
    }

    return NextResponse.json(noticia);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al obtener la noticia" }, { status: 500 });
  }
}

/* =====================================================
   PUT → Actualizar noticia
===================================================== */
export async function PUT(request: Request) {
  try {
    // Obtener ID desde la URL
    const url = new URL(request.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const noticiaActualizada = await prisma.noticia.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        contenido: body.contenido,
        imagen: body.imagen,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
        autor: body.autor,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al actualizar la noticia" }, { status: 500 });
  }
}

/* =====================================================
   DELETE → Eliminar noticia
===================================================== */
export async function DELETE(request: Request) {
  try {
    // Obtener ID desde la URL
    const url = new URL(request.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    await prisma.noticia.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar la noticia" }, { status: 500 });
  }
}
