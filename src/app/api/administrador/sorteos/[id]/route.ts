import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET → Obtener sorteo por ID
========================================================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sorteoId = Number(id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sorteo = await prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: { sorteo_producto: true },
    });

    if (!sorteo) {
      return NextResponse.json(
        { error: "Sorteo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(sorteo);
  } catch (error) {
    console.error("ERROR GET SORTEO:", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT → Editar sorteo
========================================================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sorteoId = Number(id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // ⚠️ fecha y año SON OBLIGATORIOS en tu schema
    if (!body.fecha_hora || !body.anio) {
      return NextResponse.json(
        { error: "Fecha y año son obligatorios" },
        { status: 400 }
      );
    }

    const actualizado = await prisma.sorteo.update({
      where: { id: sorteoId },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        imagen: body.imagen,
        lugar: body.lugar,
        fecha_hora: new Date(body.fecha_hora), // nunca null
        anio: Number(body.anio),               // nunca null
        estado: body.estado || "ACTIVO",

        // 🔥 reset premios completo
        sorteo_producto: {
          deleteMany: {},
          create:
            body.premios?.map((p: any) => ({
              nombre: p.nombre,
              descripcion: p.descripcion,
              cantidad: Number(p.cantidad || 1),
            })) || [],
        },
      },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("ERROR UPDATE:", error);
    return NextResponse.json(
      { error: "Error actualizando sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE → Eliminar sorteo
========================================================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sorteoId = Number(id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // eliminar premios primero
    await prisma.sorteo_producto.deleteMany({
      where: { sorteo_id: sorteoId },
    });

    // eliminar sorteo
    await prisma.sorteo.delete({
      where: { id: sorteoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE:", error);
    return NextResponse.json(
      { error: "Error eliminando sorteo" },
      { status: 500 }
    );
  }
}
