import bcrypt from "bcryptjs";
import { UserModel } from "@/models/UserModel";

export class UsuarioValidationError extends Error {}

function normalizarRol(rol: unknown): string {
  return rol === "administrador" ? "administrador" : "secretaria";
}

function normalizarPermisos(permisos: unknown): string[] {
  return Array.isArray(permisos) ? permisos : [];
}

export const UsuarioController = {
  obtenerUsuarios: () => UserModel.obtenerTodos(),

  crearUsuario: async (input: {
    nombre?: string;
    email?: string;
    password?: string;
    rol?: string;
    permisos?: unknown;
  }) => {
    const nombre = (input.nombre || "").trim();
    const email = (input.email || "").trim().toLowerCase();
    const password = input.password || "";
    const rol = normalizarRol(input.rol);
    const permisos = normalizarPermisos(input.permisos);

    if (!nombre || !email || !password) {
      throw new UsuarioValidationError("Nombre, correo y contraseña son obligatorios");
    }

    if (password.length < 6) {
      throw new UsuarioValidationError("La contraseña debe tener al menos 6 caracteres");
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
    input: { nombre?: string; rol?: string; permisos?: unknown; password?: string }
  ) => {
    const nombre = (input.nombre || "").trim();
    const rol = normalizarRol(input.rol);
    const permisos = normalizarPermisos(input.permisos);
    const nuevaPassword = input.password || undefined;

    if (!nombre) {
      throw new UsuarioValidationError("El nombre es obligatorio");
    }

    // Evita que alguien se quite a sí mismo el permiso de usuarios
    // y quede sin forma de revertirlo.
    if (id === actorId && rol !== "administrador" && !permisos.includes("usuarios")) {
      throw new UsuarioValidationError("No puedes quitarte a ti mismo el acceso a Usuarios");
    }

    let passwordHash: string | undefined;
    if (nuevaPassword) {
      if (nuevaPassword.length < 6) {
        throw new UsuarioValidationError("La contraseña debe tener al menos 6 caracteres");
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

  eliminarUsuario: async (id: number, actorId: number) => {
    if (id === actorId) {
      throw new UsuarioValidationError("No puedes eliminar tu propia cuenta");
    }

    return UserModel.eliminar(id);
  },
};
