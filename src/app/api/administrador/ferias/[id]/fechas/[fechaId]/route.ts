import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   GET – listar fechas de un evento de feria
   ========================= */
export async function GET(
  _: Request,
  context: { params: { id: string } }
) {
  try {
    const eventoFeriaId = Number(context.params.id);
    if (isNaN(eventoFeriaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const fechas = await prisma.evento_feria_fecha.findMany({
      where: { feria_id: eventoFeriaId }, // ⚡ usar feria_id según tu modelo
      orderBy: { fecha: "asc" },
    });

    return NextResponse.json(fechas);
  } catch (error) {
    console.error("Error al obtener fechas:", error);
    return NextResponse.json(
      { error: "Error al obtener fechas" },
      { status: 500 }
    );
  }
}

/* =========================
   POST – crear nueva fecha
   ========================= */
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const eventoFeriaId = Number(context.params.id);
    if (isNaN(eventoFeriaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const nuevaFecha = await prisma.evento_feria_fecha.create({
      data: {
        feria_id: eventoFeriaId, // ⚡ usar feria_id según tu modelo
        fecha: new Date(body.fecha),
        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        ubicacion: body.ubicacion,
        zona: body.zona || null,
      },
    });

    return NextResponse.json(nuevaFecha);
  } catch (error) {
    console.error("Error al crear fecha:", error);
    return NextResponse.json(
      { error: "Error al crear fecha" },
      { status: 500 }
    );
  }
}
