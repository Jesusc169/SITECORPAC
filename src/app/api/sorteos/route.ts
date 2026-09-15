import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const anioParam = searchParams.get("anio");
    const anio =
      anioParam && /^\d{4}$/.test(anioParam) ? Number(anioParam) : null;

    const sorteos = await prisma.sorteo.findMany({
      where: {
        estado: "ACTIVO",
        ...(anio ? { anio } : {}),
      },
      include: { sorteo_producto: true },
      orderBy: { fecha_hora: "desc" },
    });
    return NextResponse.json(sorteos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener sorteos" },
      { status: 500 }
    );
  }
}
