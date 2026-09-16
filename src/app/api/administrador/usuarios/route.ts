import { NextResponse } from "next/server";
import { UsuarioController, UsuarioValidationError } from "@/controllers/usuarioController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export const runtime = "nodejs";

/* =========================
   GET - LISTAR USUARIOS
   (contraseña nunca se devuelve)
========================= */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "usuarios")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarios = await UsuarioController.obtenerUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("ERROR GET USUARIOS:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

/* =========================
   POST - CREAR USUARIO
========================= */
export async function POST(req: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "usuarios")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const nuevoUsuario = await UsuarioController.crearUsuario(body);

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ERROR CREAR USUARIO:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
