import { NextResponse } from "next/server";
import { FeriaController } from "@/controllers/feriaController";

// 🔥 cache 60s
export const revalidate = 60;

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ferias = await FeriaController.obtenerFeriasPublicas({
      anioParam: searchParams.get("anio"),
      pageParam: searchParams.get("page"),
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
