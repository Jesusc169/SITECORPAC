import { NextResponse } from "next/server";
import { UsuarioController, UsuarioValidationError } from "@/controllers/usuarioController";
import { obtenerUsuarioActual, firmarTokenSesion, opcionesCookieSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, nombreEntidad, nombreONumero } from "@/lib/registro";

/** " (rol secretaria; permisos: noticias; cambió la contraseña)" o "" */
function describirCambiosCuenta(body: { rol?: string; permisos?: unknown; password?: string } | null): string {
  const cambios: string[] = [];
  if (body?.rol) cambios.push("rol " + body.rol);
  if (Array.isArray(body?.permisos)) {
    const lista = body.permisos.length ? body.permisos.join(", ") : "ninguno";
    cambios.push("permisos: " + lista);
  }
  if (body?.password) cambios.push("cambió la contraseña");
  return cambios.length ? " (" + cambios.join("; ") + ")" : "";
}

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

    const cambios = describirCambiosCuenta(body);
    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo: "usuarios",
      entidadId: id,
      detalle: `Editó la cuenta de ${nombreONumero(await nombreEntidad("usuarios", id), id)}${cambios}`,
      request,
    });

    const { sesionVersion, ...sinVersion } = actualizado;
    const respuesta = NextResponse.json(sinVersion);
    // Cambiar la contraseña cierra todas las sesiones de esa cuenta. Si es
    // la propia, se firma una cookie nueva para no sacar a quien la cambió.
    if (body?.password && id === usuarioActual.id) {
      respuesta.cookies.set(
        "token",
        firmarTokenSesion({ ...usuarioActual, sesionVersion }),
        opcionesCookieSesion()
      );
    }
    return respuesta;
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
    await UsuarioController.eliminarUsuario(id, usuarioActual.id, usuarioActual.rol === "administrador");

    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: "usuarios",
      entidadId: id,
      detalle: `Eliminó la cuenta de ${nombreONumero(cuenta, id)}`,
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

/* =========================
   PATCH - ACCIONES SOBRE LA CUENTA
   { accion: "desactivar" | "activar" | "cerrar_sesiones" }
========================= */
export async function PATCH(
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

    const body = await request.json().catch(() => ({}));
    const accion = body?.accion;
    const esAdmin = usuarioActual.rol === "administrador";
    const cuenta = nombreONumero(await nombreEntidad("usuarios", id), id);

    if (accion === "desactivar" || accion === "activar") {
      const activo = accion === "activar";
      const r = await UsuarioController.cambiarActivo(id, usuarioActual.id, activo, esAdmin);
      await registrarActividad({
        usuario: usuarioActual,
        accion: "editar",
        modulo: "usuarios",
        entidadId: id,
        nivel: "aviso",
        detalle: activo
          ? `Reactivó la cuenta de ${cuenta}`
          : `Desactivó la cuenta de ${cuenta} (se cerraron sus sesiones)`,
        request,
      });
      return NextResponse.json(r);
    }

    if (accion === "cerrar_sesiones") {
      const r = await UsuarioController.cerrarSesiones(id, esAdmin);
      await registrarActividad({
        usuario: usuarioActual,
        accion: "editar",
        modulo: "usuarios",
        entidadId: id,
        nivel: "aviso",
        detalle:
          id === usuarioActual.id
            ? "Cerró sus sesiones abiertas en otros equipos"
            : `Cerró todas las sesiones abiertas de ${cuenta}`,
        request,
      });
      const { sesionVersion, ...sinVersion } = r;
      const respuesta = NextResponse.json(sinVersion);
      // Si cerró las suyas, esta sesión sigue: se le firma una cookie nueva.
      if (id === usuarioActual.id) {
        respuesta.cookies.set(
          "token",
          firmarTokenSesion({ ...usuarioActual, sesionVersion }),
          opcionesCookieSesion()
        );
      }
      return respuesta;
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    if (error instanceof UsuarioValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await registrarError("usuarios", "Acción sobre cuenta", error, request);
    return NextResponse.json({ error: "Error al actualizar la cuenta" }, { status: 500 });
  }
}
