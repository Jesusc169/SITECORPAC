import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
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
    const nombre = (body.nombre || "").trim();
    const rol = body.rol === "administrador" ? "administrador" : "secretaria";
    const permisos: string[] = Array.isArray(body.permisos) ? body.permisos : [];
    const nuevaPassword: string | undefined = body.password || undefined;

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Evita que alguien se quite a sí mismo el permiso de usuarios
    // y quede sin forma de revertirlo.
    if (id === usuarioActual.id && rol !== "administrador" && !permisos.includes("usuarios")) {
      return NextResponse.json(
        { error: "No puedes quitarte a ti mismo el acceso a Usuarios" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { nombre, rol, permisos };

    if (nuevaPassword) {
      if (nuevaPassword.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(nuevaPassword, 10);
    }

    const actualizado = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        permisos: true,
        createdAt: true,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
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

    if (id === usuarioActual.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERROR ELIMINAR USUARIO:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
