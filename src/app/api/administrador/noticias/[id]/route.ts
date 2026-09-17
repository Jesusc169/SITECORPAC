import { NextResponse } from "next/server";
import { NoticiasController, NoticiaValidationError } from "@/controllers/noticiasController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export const runtime = "nodejs";

/* =====================================================
   PUT → Actualizar noticia
===================================================== */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const formData = await request.formData();
    const pdfsEliminarRaw = formData.get("pdfsEliminar")?.toString() || "[]";
    const imagenesEliminarRaw = formData.get("imagenesEliminar")?.toString() || "[]";

    let pdfsEliminar: number[] = [];
    try {
      pdfsEliminar = JSON.parse(pdfsEliminarRaw);
    } catch {
      pdfsEliminar = [];
    }

    let imagenesEliminar: number[] = [];
    try {
      imagenesEliminar = JSON.parse(imagenesEliminarRaw);
    } catch {
      imagenesEliminar = [];
    }

    const imagenPrincipalIdRaw = formData.get("imagenPrincipalId");
    const imagenPrincipalNuevaIndexRaw = formData.get("imagenPrincipalNuevaIndex");

    const noticiaActualizada = await NoticiasController.actualizarNoticiaCompleta(id, {
      titulo: formData.get("titulo") as string,
      descripcion: formData.get("descripcion") as string,
      contenido: formData.get("contenido") as string,
      autor: formData.get("autor") as string,
      imagenesNuevas: formData.getAll("imagenes") as File[],
      imagenesEliminar,
      imagenPrincipalId: imagenPrincipalIdRaw ? Number(imagenPrincipalIdRaw) : null,
      imagenPrincipalNuevaIndex: imagenPrincipalNuevaIndexRaw
        ? Number(imagenPrincipalNuevaIndexRaw)
        : null,
      pdfFilesNuevos: formData.getAll("pdfs") as File[],
      pdfsEliminar,
    });

    if (!noticiaActualizada) {
      return NextResponse.json({ message: "Noticia no encontrada" }, { status: 404 });
    }

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    if (error instanceof NoticiaValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar noticia" },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE → Eliminar noticia
===================================================== */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const eliminada = await NoticiasController.eliminarNoticiaCompleta(id);

    if (!eliminada) {
      return NextResponse.json({ message: "Noticia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Noticia eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar noticia" },
      { status: 500 }
    );
  }
}
