import { NextResponse } from "next/server";
import { UsuarioController, UsuarioValidationError } from "@/controllers/usuarioController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

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
    const actualizado = await UsuarioController.actualizarUsuario(id, usuarioActual.id, body);

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ERROR EDITAR USUARIO:", error);
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

    await UsuarioController.eliminarUsuario(id, usuarioActual.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ERROR ELIMINAR USUARIO:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
