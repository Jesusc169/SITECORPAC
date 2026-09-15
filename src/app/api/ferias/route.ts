import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🔥 cache 60s
export const revalidate = 60;

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    const anioParam = searchParams.get("anio");

    // ✅ VALIDACIÓN SEGURA DEL AÑO
    let anioFiltro: number | null = null;

    if (anioParam && /^\d{4}$/.test(anioParam)) {
      anioFiltro = Number(anioParam);
    }

    const ferias = await prisma.evento_feria.findMany({
      where: {
        estado: true,
        ...(anioFiltro ? { anio: anioFiltro } : {}),
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
      include: {
        evento_feria_empresa: {
          include: {
            empresa: true,
          },
        },
        evento_feria_fecha: true,
      },
    });

    return NextResponse.json(ferias);
  } catch (error) {
    console.error("ERROR LISTAR FERIAS:", error);
    return NextResponse.json(
      { error: "Error al obtener ferias" },
      { status: 500 }
    );
  }
}
