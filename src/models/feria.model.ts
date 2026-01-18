import { NextResponse } from "next/server";
import { FeriaController } from "@/controllers/feria.controller";

/**
 * GET /api/ferias
 */
export async function GET() {
  try {
    const ferias = await FeriaController.listarFerias();
    return NextResponse.json(ferias, { status: 200 });
  } catch (error) {
    console.error("GET /api/ferias", error);
    return NextResponse.json(
      { error: "Error al obtener ferias" },
      { status: 500 }
    );
  }
}
