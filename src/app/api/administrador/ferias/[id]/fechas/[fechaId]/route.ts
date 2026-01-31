import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   PUT – editar fecha
========================= */
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const fechaIdStr = url.pathname.split("/").pop();
    const id = Number(fechaIdStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const fecha = await prisma.evento_feria_fecha.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(fecha);
  } catch (error) {
    console.error("Error al actualizar fecha:", error);
    return NextResponse.json(
      { error: "Error al actualizar fecha" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE – eliminar fecha
========================= */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const fechaIdStr = url.pathname.split("/").pop();
    const id = Number(fechaIdStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.evento_feria_fecha.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar fecha:", error);
    return NextResponse.json(
      { error: "Error al eliminar fecha" },
      { status: 500 }
    );
  }
}
