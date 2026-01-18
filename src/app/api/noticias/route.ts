import { NextResponse } from "next/server";
import { obtenerNoticias, crearNoticia } from "@/controllers/noticiasController";
import type { Noticia } from "@prisma/client";

// GET /api/noticias
export async function GET(): Promise<NextResponse<Noticia[] | { error: string }>> {
  try {
    const noticias: Noticia[] = await obtenerNoticias();
    return NextResponse.json(noticias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener noticias" }, { status: 500 });
  }
}

// POST /api/noticias
export async function POST(req: Request): Promise<NextResponse<Noticia | { error: string }>> {
  try {
    const data: { titulo: string; descripcion: string } = await req.json();
    const nuevaNoticia: Noticia = await crearNoticia(data);
    return NextResponse.json(nuevaNoticia);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear noticia" }, { status: 500 });
  }
}
