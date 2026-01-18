import { NextResponse } from "next/server";
import { obtenerNoticiaPorId, actualizarNoticia, eliminarNoticia } from "@/controllers/noticiasController";

export async function GET(req, { params }) {
  const noticia = await obtenerNoticiaPorId(params.id);
  return noticia
    ? NextResponse.json(noticia)
    : NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
}

export async function PUT(req, { params }) {
  const data = await req.json();
  const noticiaActualizada = await actualizarNoticia(params.id, data);
  return NextResponse.json(noticiaActualizada);
}

export async function DELETE(req, { params }) {
  await eliminarNoticia(params.id);
  return NextResponse.json({ message: "Noticia eliminada" });
}
