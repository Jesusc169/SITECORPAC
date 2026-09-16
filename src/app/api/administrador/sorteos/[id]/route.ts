import { NextRequest, NextResponse } from "next/server";
import { SorteoController } from "@/controllers/sorteoController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

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

    const imagenFile = formData.get("imagen") as File | null;

    const actualizado = await SorteoController.actualizarSorteo(sorteoId, {
      nombre,
      descripcion,
      lugar,
      anio,
      estado,
      fecha_hora: new Date(fecha_hora),
      premios,
      imagenFile,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ERROR PUT:", error);
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

    await SorteoController.eliminarSorteo(sorteoId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE:", error);
    return NextResponse.json(
      { error: "Error eliminando sorteo" },
      { status: 500 }
    );
  }
}
