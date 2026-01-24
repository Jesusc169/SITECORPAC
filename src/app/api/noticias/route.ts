import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: {
        fechaPublicacion: "desc",
      },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}
