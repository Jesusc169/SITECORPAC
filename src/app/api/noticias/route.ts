import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: {
        fecha: "desc", // ✅ campo existente en el schema
      },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    console.error("Error al obtener noticias:", error);

    return NextResponse.json(
      { error: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}
