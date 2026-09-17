import { NextResponse } from "next/server";
import { FeriaController } from "@/controllers/feriaController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

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
    });

    if (!feria) {
      return NextResponse.json({ error: "Feria no encontrada" }, { status: 404 });
    }

    return NextResponse.json(feria);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("PUT FERIA ERROR:", error);
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
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const feriaId = Number(id);

    await FeriaController.eliminarFeria(feriaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al eliminar feria" },
      { status: 500 }
    );
  }
}
