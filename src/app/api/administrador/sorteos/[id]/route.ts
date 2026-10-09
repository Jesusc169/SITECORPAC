import { NextRequest, NextResponse } from "next/server";
import { SorteoController, SorteoValidationError } from "@/controllers/sorteoController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, nombreEntidad, textoVisible } from "@/lib/registro";
import { instantanea } from "@/lib/historial";

export const runtime = "nodejs";

/* =========================================================
   GET → Obtener sorteo por ID
========================================================= */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sorteo = await SorteoController.obtenerSorteoPorId(sorteoId);

    if (!sorteo) {
      return NextResponse.json(
        { error: "Sorteo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(sorteo);
  } catch (error) {
    console.error("ERROR GET:", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT → Editar sorteo
========================================================= */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await request.formData();

    const nombre = formData.get("nombre")?.toString().trim() || "";
    const descripcion = formData.get("descripcion")?.toString().trim() || "";
    const lugar = formData.get("lugar")?.toString().trim() || "";
    const fecha_hora = formData.get("fecha_hora")?.toString().trim() || "";

    let anio = Number(formData.get("anio"));
    const estado =
      formData.get("estado")?.toString() === "INACTIVO" ? "INACTIVO" : "ACTIVO";

    const premiosRaw = formData.get("premios")?.toString() || "[]";
    let premios: any[] = [];
    try {
      premios = JSON.parse(premiosRaw);
    } catch {
      premios = [];
    }

    if (!nombre || !descripcion || !lugar || !fecha_hora) {
      return NextResponse.json(
        { error: "Campos obligatorios incompletos" },
        { status: 400 }
      );
    }

    if (!anio || isNaN(anio)) {
      anio = new Date(fecha_hora).getFullYear();
    }

    const imagenesEliminarRaw = formData.get("imagenesEliminar")?.toString() || "[]";
    let imagenesEliminar: number[] = [];
    try {
      imagenesEliminar = JSON.parse(imagenesEliminarRaw);
    } catch {
      imagenesEliminar = [];
    }

    const imagenPrincipalIdRaw = formData.get("imagenPrincipalId");
    const imagenPrincipalNuevaIndexRaw = formData.get("imagenPrincipalNuevaIndex");

    const antes = await instantanea("sorteos", sorteoId);
    const actualizado = await SorteoController.actualizarSorteo(sorteoId, {
      nombre,
      descripcion,
      lugar,
      anio,
      estado,
      fecha_hora: new Date(fecha_hora),
      premios,
      imagenesNuevas: formData.getAll("imagenes") as File[],
      imagenesEliminar,
      imagenPrincipalId: imagenPrincipalIdRaw ? Number(imagenPrincipalIdRaw) : null,
      imagenPrincipalNuevaIndex: imagenPrincipalNuevaIndexRaw
        ? Number(imagenPrincipalNuevaIndexRaw)
        : null,
    });

    if (!actualizado) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "sorteos",
      entidadId: sorteoId,
      antes,
      despues: await instantanea("sorteos", sorteoId),
      detalle: `Editó el sorteo "${nombre}" (${textoVisible(estado !== "INACTIVO")})`,
      request,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError || error instanceof SorteoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("sorteos", "Editar sorteo", error, request);
    return NextResponse.json(
      { error: "Error actualizando sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE → Eliminar sorteo
========================================================= */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const nombreSorteo = await nombreEntidad("sorteos", sorteoId);
    await SorteoController.eliminarSorteo(sorteoId, usuarioActual);

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "sorteos",
      entidadId: sorteoId,
      detalle: `Eliminó el sorteo "${nombreSorteo ?? `#${sorteoId}`}" (queda 30 días en la papelera)`,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await registrarError("sorteos", "Eliminar sorteo", error, request);
    return NextResponse.json(
      { error: "Error eliminando sorteo" },
      { status: 500 }
    );
  }
}
