import { NextResponse } from "next/server";
import { NoticiasController } from "@/controllers/noticiasController";
import type { noticia } from "@prisma/client";
import { verificarSesion } from "@/lib/auth";

// 🔹 GET /api/admin/noticias/[id] → obtener noticia por ID
export async function GET(req: Request): Promise<NextResponse<noticia | { error: string }>> {
  try {
    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").slice(-1)[0]);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const noticiaItem = await NoticiasController.obtenerNoticiaPorId(id);
    if (!noticiaItem) return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });

    return NextResponse.json(noticiaItem);
  } catch (error) {
    console.error("Error al obtener noticia:", error);
    return NextResponse.json({ error: "Error al obtener noticia" }, { status: 500 });
  }
}

// 🔹 PUT /api/admin/noticias/[id] → actualizar noticia
export async function PUT(req: Request): Promise<NextResponse<noticia | { error: string }>> {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").slice(-1)[0]);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data: Partial<noticia> = await req.json();
    const noticiaActualizada = await NoticiasController.actualizarNoticia(id, data);

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    console.error("Error al actualizar noticia:", error);
    return NextResponse.json({ error: "Error al actualizar noticia" }, { status: 500 });
  }
}

// 🔹 DELETE /api/admin/noticias/[id] → eliminar noticia
export async function DELETE(req: Request): Promise<NextResponse<{ message: string } | { error: string }>> {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").slice(-1)[0]);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await NoticiasController.eliminarNoticia(id);
    return NextResponse.json({ message: "Noticia eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar noticia:", error);
    return NextResponse.json({ error: "Error al eliminar noticia" }, { status: 500 });
  }
}
