import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   GET – obtener una fecha específica
   ========================= */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fechaId = Number(url.pathname.split("/").pop());
    if (isNaN(fechaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const fecha = await prisma.evento_feria_fecha.findUnique({
      where: { id: fechaId },
    });

    if (!fecha) {
      return NextResponse.json({ error: "Fecha no encontrada" }, { status: 404 });
    }

    return NextResponse.json(fecha);
  } catch (error) {
    console.error("Error al obtener fecha:", error);
    return NextResponse.json({ error: "Error al obtener fecha" }, { status: 500 });
  }
}

/* =========================
   PUT – editar fecha
   ========================= */
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const fechaId = Number(url.pathname.split("/").pop());
    if (isNaN(fechaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const fecha = await prisma.evento_feria_fecha.update({
      where: { id: fechaId },
      data: {
        fecha: new Date(body.fecha),
        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        ubicacion: body.ubicacion,
        zona: body.zona || null,
      },
    });

    return NextResponse.json(fecha);
  } catch (error) {
    console.error("Error al actualizar fecha:", error);
    return NextResponse.json({ error: "Error al actualizar fecha" }, { status: 500 });
  }
}

/* =========================
   DELETE – eliminar fecha
   ========================= */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const fechaId = Number(url.pathname.split("/").pop());
    if (isNaN(fechaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.evento_feria_fecha.delete({ where: { id: fechaId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar fecha:", error);
    return NextResponse.json({ error: "Error al eliminar fecha" }, { status: 500 });
  }
}
