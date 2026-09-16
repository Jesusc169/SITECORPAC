import { NextResponse } from "next/server";
import { DirectorioController } from "@/controllers/directorioController";

/* =========================
   CACHE SIMPLE (DEV)
========================= */
let cache: any[] | null = null;
let lastFetch = 0;
const TTL = 60_000; // 1 minuto

export async function GET() {
  try {
    const now = Date.now();

    if (cache && now - lastFetch < TTL) {
      return NextResponse.json(cache);
    }

    const directorio = await DirectorioController.obtenerDirectorioPublico();

    cache = directorio;
    lastFetch = now;

    return NextResponse.json(directorio);
  } catch (error) {
    console.error("Error al obtener directorio:", error);
    return NextResponse.json(
      { error: "Error al obtener directorio" },
      { status: 500 }
    );
  }
}
