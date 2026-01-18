import { NextRequest, NextResponse } from "next/server";
import { NoticiasController } from "../controllers/NoticiasController";

// Actualizar noticia
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return await NoticiasController.actualizarNoticia(req, null, { params });
}

// Eliminar noticia
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return await NoticiasController.eliminarNoticia(req, null, { params });
}
