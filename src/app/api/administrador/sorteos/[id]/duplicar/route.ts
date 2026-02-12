import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sorteoId = Number(id);

    if (!sorteoId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const original = await prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: { sorteo_producto: true },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Sorteo no encontrado" },
        { status: 404 }
      );
    }

    const nuevo = await prisma.sorteo.create({
      data: {
        nombre: original.nombre + " (Copia)",
        descripcion: original.descripcion,
        imagen: original.imagen,
        lugar: original.lugar,
        fecha_hora: original.fecha_hora,
        anio: original.anio,
        estado: "ACTIVO",

        sorteo_producto: {
          create: original.sorteo_producto.map((p) => ({
            nombre: p.nombre,
            descripcion: p.descripcion,
            cantidad: p.cantidad,
          })),
        },
      },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    console.error("ERROR DUPLICAR:", error);
    return NextResponse.json(
      { error: "Error duplicando sorteo" },
      { status: 500 }
    );
  }
}
