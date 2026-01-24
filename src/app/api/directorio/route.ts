import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const data = await prisma.directorio.findMany({
      orderBy: { orden: "asc" },
    });

    // 🔥 NORMALIZAMOS PARA EL FRONT
    const directorio = data.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      cargo: d.cargo,

      // 🔑 claves que el front suele usar
      email: d.correo,
      telefono: d.telefono,

      foto: d.fotoUrl,

      fechaInicio: d.periodoInicio,
      fechaFin: d.periodoFin,

      createdAt: d.createdAt,
      orden: d.orden,
    }));

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
