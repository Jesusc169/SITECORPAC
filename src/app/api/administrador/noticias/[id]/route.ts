import { NextResponse } from "next/server";
import { NoticiasController, NoticiaValidationError } from "@/controllers/noticiasController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { leerVisible } from "@/lib/visibilidad";
import { registrarActividad, registrarError, nombreEntidad, textoVisible } from "@/lib/registro";
import { instantanea } from "@/lib/historial";
import { campoTexto, campoTextoODefecto, campoOpcional } from "@/lib/formulario";

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

    const antes = await instantanea("noticias", id);
    const noticiaActualizada = await NoticiasController.actualizarNoticiaCompleta(id, {
      titulo: campoTexto(formData, "titulo"),
      descripcion: campoTexto(formData, "descripcion"),
      contenido: campoOpcional(formData, "contenido"),
      autor: campoTextoODefecto(formData, "autor", "SITECORPAC"),
      activo: leerVisible(formData),
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

    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "noticias",
      entidadId: id,
      antes,
      despues: await instantanea("noticias", id),
      detalle: `Editó la noticia "${noticiaActualizada.titulo}" (${textoVisible(noticiaActualizada.activo)})`,
      request,
    });

    return NextResponse.json(noticiaActualizada);
  } catch (error) {
    if (error instanceof NoticiaValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await registrarError("noticias", "Editar noticia", error, request);
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

    const titulo = await nombreEntidad("noticias", id);
    const eliminada = await NoticiasController.eliminarNoticiaCompleta(id, usuarioActual);

    if (!eliminada) {
      return NextResponse.json({ message: "Noticia no encontrada" }, { status: 404 });
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "noticias",
      entidadId: id,
      detalle: `Eliminó la noticia "${titulo ?? `#${id}`}" (queda 30 días en la papelera)`,
      request,
    });

    return NextResponse.json({ message: "Noticia eliminada correctamente" });
  } catch (error) {
    await registrarError("noticias", "Eliminar noticia", error, request);
    return NextResponse.json(
      { message: "Error al eliminar noticia" },
      { status: 500 }
    );
  }
}
