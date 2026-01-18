import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   GET – listar fechas
   ========================= */
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const feriaId = Number(params.id);

  const fechas = await prisma.evento_feria_fecha.findMany({
    where: { feria_id: feriaId },
    orderBy: { fecha: "asc" },
  });

  return NextResponse.json(fechas);
}

/* =========================
   POST – crear fecha
   ========================= */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const feriaId = Number(params.id);
    const body = await request.json();

    const nuevaFecha = await prisma.evento_feria_fecha.create({
      data: {
        feria_id: feriaId,

        // 🔥 FIX CLAVE
        fecha: new Date(body.fecha), // ← AQUÍ ESTÁ LA MAGIA

        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        ubicacion: body.ubicacion,
        zona: body.zona || null,
      },
    });

    return NextResponse.json(nuevaFecha);
  } catch (error) {
    console.error("ERROR CREAR FECHA:", error);
    return NextResponse.json(
      { error: "Error al crear fecha" },
      { status: 500 }
    );
  }
}
