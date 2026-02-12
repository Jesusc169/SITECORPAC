import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================
// DELETE SORTEO
// =============================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sorteoId = Number(id);

    if (!sorteoId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // eliminar premios primero (por FK)
    await prisma.sorteo_producto.deleteMany({
      where: { sorteo_id: sorteoId },
    });

    // eliminar sorteo
    await prisma.sorteo.delete({
      where: { id: sorteoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERROR ELIMINAR:", error);
    return NextResponse.json(
      { error: "Error eliminando sorteo" },
      { status: 500 }
    );
  }
}
