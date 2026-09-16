import { NextResponse } from "next/server";
import { SorteoController } from "@/controllers/sorteoController";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sorteos = await SorteoController.obtenerSorteosPublicos(searchParams.get("anio"));
    return NextResponse.json(sorteos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener sorteos" },
      { status: 500 }
    );
  }
}
