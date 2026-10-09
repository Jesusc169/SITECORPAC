import { NextResponse } from "next/server";
import { UsuarioController, UsuarioValidationError } from "@/controllers/usuarioController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, nombreEntidad } from "@/lib/registro";

export const runtime = "nodejs";

/* =========================
   PUT - EDITAR USUARIO
   (rol, permisos y, opcionalmente, contraseña nueva)
========================= */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "usuarios")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const actualizado = await UsuarioController.actualizarUsuario(
      id,
      usuarioActual.id,
      body,
      usuarioActual.rol === "administrador"
    );

    const cambios = [
      body?.rol ? `rol ${body.rol}` : null,
      Array.isArray(body?.permisos) ? `permisos: ${body.permisos.join(", ") || "ninguno"}` : null,
      body?.password ? "cambió la contraseña" : null,
    ].filter(Boolean);
    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "usuarios",
      entidadId: id,
      detalle: `Editó la cuenta de ${(await nombreEntidad("usuarios", id)) ?? `#${id}`}${cambios.length ? ` (${cambios.join("; ")})` : ""}`,
      request,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("usuarios", "Editar usuario", error, request);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE - ELIMINAR USUARIO
========================= */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "usuarios")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const cuenta = await nombreEntidad("usuarios", id);
    await UsuarioController.eliminarUsuario(id, usuarioActual.id);

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "usuarios",
      entidadId: id,
      detalle: `Eliminó la cuenta de ${cuenta ?? `#${id}`}`,
      request,
      nivel: "aviso",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("usuarios", "Eliminar usuario", error, request);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
