import { NextResponse } from "next/server";
import { UsuarioController, UsuarioValidationError } from "@/controllers/usuarioController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, idDe } from "@/lib/registro";

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
    await registrarError("usuarios", "Listar usuarios", error);
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
    const nuevoUsuario = await UsuarioController.crearUsuario(
      body,
      usuarioActual.rol === "administrador"
    );

    await registrarActividad({
      usuario: usuarioActual,
      accion: "crear",
      modulo: "usuarios",
      entidadId: idDe(nuevoUsuario),
      detalle: `Creó la cuenta de ${body?.nombre ?? ""} <${body?.email ?? ""}> con rol ${body?.rol ?? "secretaria"}`,
      request: req,
    });

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("usuarios", "Crear usuario", error, req);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
