// app/admin/noticias/[id]/route.ts
import { NextResponse } from "next/server";
import { NoticiasController } from "@/controllers/noticiasController";
import type { Noticia } from "@prisma/client";

// 🔹 GET /api/admin/noticias/[id] → obtener noticia por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<Noticia | { error: string }>> {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const noticia = await NoticiasController.obtenerNoticiaPorId(id);
    if (!noticia) return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });

    return NextResponse.json(noticia);
  } catch (error) {
    console.error("Error al obtener noticia:", error);
    return NextResponse.json({ error: "Error al obtener noticia" }, { status: 500 });
  }
}

// 🔹 PUT /api/admin/noticias/[id] → actualizar noticia
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<Noticia | { error: string }>> {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data: Partial<Noticia> = await req.json();
    const noticiaActualizada = await NoticiasController.actualizarNoticia(id, data);

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    console.error("Error al actualizar noticia:", error);
    return NextResponse.json({ error: "Error al actualizar noticia" }, { status: 500 });
  }
}

// 🔹 DELETE /api/admin/noticias/[id] → eliminar noticia
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await NoticiasController.eliminarNoticia(id);
    return NextResponse.json({ message: "Noticia eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar noticia:", error);
    return NextResponse.json({ error: "Error al eliminar noticia" }, { status: 500 });
  }
}
