import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const miembros = await prisma.directorio.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener directorio público:", error);
    return NextResponse.json({ error: "Error al obtener directorio" }, { status: 500 });
  }
}
