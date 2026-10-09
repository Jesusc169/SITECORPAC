import { NextResponse } from "next/server";
import { FeriaController, FeriaValidationError } from "@/controllers/feriaController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { leerVisible } from "@/lib/visibilidad";
import { registrarActividad, registrarError, nombreEntidad, textoVisible } from "@/lib/registro";

/* =========================
   GET – Feria por ID
   ========================= */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const feriaId = Number(id);

  const feria = await FeriaController.obtenerFeriaPorId(feriaId);

  if (!feria) {
    return NextResponse.json({ error: "Feria no encontrada" }, { status: 404 });
  }

  return NextResponse.json(feria);
}

/* =========================
   PUT – Editar feria
   ========================= */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const feriaId = Number(id);

    const formData = await req.formData();

    const empresasRaw = formData.get("empresas") as string;
    const fechasRaw = formData.get("fechas") as string;
    const imagenesEliminarRaw = formData.get("imagenesEliminar")?.toString() || "[]";

    let imagenesEliminar: number[] = [];
    try {
      imagenesEliminar = JSON.parse(imagenesEliminarRaw);
    } catch {
      imagenesEliminar = [];
    }

    const imagenPrincipalIdRaw = formData.get("imagenPrincipalId");
    const imagenPrincipalNuevaIndexRaw = formData.get("imagenPrincipalNuevaIndex");

    const feria = await FeriaController.actualizarFeria(feriaId, {
      titulo: formData.get("titulo") as string,
      descripcion: formData.get("descripcion") as string,
      imagenesNuevas: formData.getAll("imagenes") as File[],
      imagenesEliminar,
      imagenPrincipalId: imagenPrincipalIdRaw ? Number(imagenPrincipalIdRaw) : null,
      imagenPrincipalNuevaIndex: imagenPrincipalNuevaIndexRaw
        ? Number(imagenPrincipalNuevaIndexRaw)
        : null,
      empresas: empresasRaw ? JSON.parse(empresasRaw) : [],
      fechas: fechasRaw ? JSON.parse(fechasRaw) : [],
      estado: leerVisible(formData, "estado"),
      anio: formData.get("anio") ? Number(formData.get("anio")) : null,
    });

    if (!feria) {
      return NextResponse.json({ error: "Feria no encontrada" }, { status: 404 });
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "ferias",
      entidadId: feriaId,
      detalle: `Editó la feria "${formData.get("titulo")?.toString() ?? ""}" (${textoVisible(leerVisible(formData, "estado"))})`,
      request: req,
    });

    return NextResponse.json(feria);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError || error instanceof FeriaValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("ferias", "Editar feria", error, req);
    return NextResponse.json(
      { error: "Error al actualizar feria" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE – Eliminar feria
   ========================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const feriaId = Number(id);

    const titulo = await nombreEntidad("ferias", feriaId);
    await FeriaController.eliminarFeria(feriaId);

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "ferias",
      entidadId: feriaId,
      detalle: `Eliminó la feria "${titulo ?? `#${feriaId}`}"`,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await registrarError("ferias", "Eliminar feria", error, req);
    return NextResponse.json(
      { error: "Error al eliminar feria" },
      { status: 500 }
    );
  }
}
