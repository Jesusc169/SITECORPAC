import bcrypt from "bcryptjs";
import { UserModel } from "@/models/UserModel";

export class UsuarioValidationError extends Error {}

// El permiso "usuarios" es delegable (una secretaria puede tenerlo para
// gestionar otras cuentas de secretaria), pero solo un administrador real
// puede otorgar el rol "administrador" — si no, cualquier cuenta con ese
// permiso podía autoascenderse (o ascender a otra cuenta) a acceso total.
function normalizarRol(rol: unknown, actorEsAdministrador: boolean): string {
  if (rol === "administrador" && actorEsAdministrador) return "administrador";
  return "secretaria";
}

function normalizarPermisos(permisos: unknown): string[] {
  return Array.isArray(permisos) ? permisos : [];
}

/**
 * Una cuenta con el permiso "usuarios" pero sin rol administrador (una
 * secretaria) solo puede gestionar cuentas de secretaria. Antes podía
 * editar al administrador — incluida su contraseña — y quedarse con el
 * panel; o bajarlo a secretaria sin querer (normalizarRol).
 */
async function obtenerObjetivo(id: number, actorEsAdministrador: boolean) {
  const objetivo = await UserModel.obtenerPorId(id);
  if (!objetivo) throw new UsuarioValidationError("Usuario no encontrado");
  if (objetivo.rol === "administrador" && !actorEsAdministrador) {
    throw new UsuarioValidationError("Solo un administrador puede modificar la cuenta de un administrador");
  }
  return objetivo;
}

export const UsuarioController = {
  obtenerUsuarios: () => UserModel.obtenerTodos(),

  crearUsuario: async (
    input: {
      nombre?: string;
      email?: string;
      password?: string;
      rol?: string;
      permisos?: unknown;
    },
    actorEsAdministrador: boolean
  ) => {
    // Un cuerpo vacío (null) es un error del formulario (400), no del servidor
    input = input ?? {};
    const nombre = (input.nombre || "").trim();
    const email = (input.email || "").trim().toLowerCase();
    const password = input.password || "";
    const rol = normalizarRol(input.rol, actorEsAdministrador);
    const permisos = normalizarPermisos(input.permisos);

    if (!nombre || !email || !password) {
      throw new UsuarioValidationError("Nombre, correo y contraseña son obligatorios");
    }

    if (password.length < 8) {
      throw new UsuarioValidationError("La contraseña debe tener al menos 8 caracteres");
    }

    if (await UserModel.existeEmail(email)) {
      throw new UsuarioValidationError("Ya existe un usuario con ese correo");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return UserModel.crear({ nombre, email, password: hashedPassword, rol, permisos });
  },

  actualizarUsuario: async (
    id: number,
    actorId: number,
    input: { nombre?: string; rol?: string; permisos?: unknown; password?: string },
    actorEsAdministrador: boolean
  ) => {
    input = input ?? {};
    const nombre = (input.nombre || "").trim();
    const rol = normalizarRol(input.rol, actorEsAdministrador);
    const permisos = normalizarPermisos(input.permisos);
    const nuevaPassword = input.password || undefined;

    if (!nombre) {
      throw new UsuarioValidationError("El nombre es obligatorio");
    }

    await obtenerObjetivo(id, actorEsAdministrador);

    // Evita que alguien se quite a sí mismo el permiso de usuarios
    // y quede sin forma de revertirlo.
    if (id === actorId && rol !== "administrador" && !permisos.includes("usuarios")) {
      throw new UsuarioValidationError("No puedes quitarte a ti mismo el acceso a Usuarios");
    }

    let passwordHash: string | undefined;
    if (nuevaPassword) {
      if (nuevaPassword.length < 8) {
        throw new UsuarioValidationError("La contraseña debe tener al menos 8 caracteres");
      }
      passwordHash = await bcrypt.hash(nuevaPassword, 10);
    }

    return UserModel.actualizar(id, {
      nombre,
      rol,
      permisos,
      ...(passwordHash && { password: passwordHash }),
    });
  },

  eliminarUsuario: async (id: number, actorId: number, actorEsAdministrador = false) => {
    if (id === actorId) {
      throw new UsuarioValidationError("No puedes eliminar tu propia cuenta");
    }

    await obtenerObjetivo(id, actorEsAdministrador);
    return UserModel.eliminar(id);
  },

  /** Desactivar (o reactivar) una cuenta sin borrarla. */
  cambiarActivo: async (
    id: number,
    actorId: number,
    activo: boolean,
    actorEsAdministrador: boolean
  ) => {
    if (id === actorId) {
      throw new UsuarioValidationError("No puedes desactivar tu propia cuenta");
    }
    await obtenerObjetivo(id, actorEsAdministrador);
    return UserModel.cambiarActivo(id, activo);
  },

  /** Cierra todas las sesiones abiertas de esa cuenta en cualquier equipo. */
  cerrarSesiones: async (id: number, actorEsAdministrador: boolean) => {
    await obtenerObjetivo(id, actorEsAdministrador);
    return UserModel.cerrarSesiones(id);
  },
};
