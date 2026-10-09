import { NextResponse } from "next/server";
import { DirectorioController } from "@/controllers/directorioController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, nombreEntidad } from "@/lib/registro";
import { instantanea } from "@/lib/historial";

/* =========================
   Utilidad fechas
========================= */
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/* =========================
   PUT - EDITAR MIEMBRO
========================= */
export async function PUT(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "directorio")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const idStr = url.pathname.split("/").pop();
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await request.formData();

    const nombre = formData.get("nombre") as string | null;
    const cargo = formData.get("cargo") as string | null;
    const correo = formData.get("correo") as string | null;
    const telefono = formData.get("telefono") as string | null;
    const periodoInicio = formData.get("periodoInicio") as string | null;
    const periodoFin = formData.get("periodoFin") as string | null;
    const foto = formData.get("foto") as File | null;

    const antes = await instantanea("directorio", id);
    const actualizado = await DirectorioController.actualizarMiembro(id, {
      nombre: nombre ?? undefined,
      cargo: cargo ?? undefined,
      correo: correo ?? undefined,
      telefono: telefono ?? undefined,
      periodoInicio: periodoInicio ? parseLocalDate(periodoInicio) : undefined,
      periodoFin: periodoFin ? parseLocalDate(periodoFin) : undefined,
      fotoFile: foto,
    });

    if (!actualizado) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "directorio",
      entidadId: id,
      antes,
      despues: await instantanea("directorio", id),
      detalle: `Editó a ${(await nombreEntidad("directorio", id)) ?? `#${id}`} en el directorio${foto && foto.size > 0 ? " (nueva foto)" : ""}`,
      request,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("directorio", "Editar miembro", error, request);
    return NextResponse.json(
      { error: "Error al actualizar miembro" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE - ELIMINAR MIEMBRO
========================= */
export async function DELETE(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "directorio")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const idStr = url.pathname.split("/").pop();
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const miembro = await nombreEntidad("directorio", id);
    const eliminado = await DirectorioController.eliminarMiembro(id, usuarioActual);

    if (!eliminado) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "directorio",
      entidadId: id,
      detalle: `Quitó a ${miembro ?? `#${id}`} del directorio (queda 30 días en la papelera)`,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await registrarError("directorio", "Quitar miembro", error, request);
    return NextResponse.json(
      { error: "Error al eliminar miembro" },
      { status: 500 }
    );
  }
}
