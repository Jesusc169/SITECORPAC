import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/UserModel", () => ({
  UserModel: {
    obtenerPorId: vi.fn().mockResolvedValue({ id: 7, rol: "secretaria", activo: true }),
    cambiarActivo: vi.fn(),
    cerrarSesiones: vi.fn(),
    existeEmail: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

import { UserModel } from "@/models/UserModel";
import { UsuarioController, UsuarioValidationError } from "./usuarioController";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsuarioController.crearUsuario", () => {
  it("rechaza contraseñas de menos de 8 caracteres", async () => {
    await expect(
      UsuarioController.crearUsuario(
        {
          nombre: "Ana",
          email: "ana@test.com",
          password: "corta1",
        },
        true
      )
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("rechaza un correo que ya tiene cuenta", async () => {
    (UserModel.existeEmail as any).mockResolvedValue(true);

    await expect(
      UsuarioController.crearUsuario(
        {
          nombre: "Ana",
          email: "ana@test.com",
          password: "contraseñaLarga1",
        },
        true
      )
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("exige nombre, correo y contraseña", async () => {
    await expect(
      UsuarioController.crearUsuario({ nombre: "", email: "", password: "" }, true)
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("no deja que una cuenta sin rol administrador cree otro administrador", async () => {
    (UserModel.existeEmail as any).mockResolvedValue(false);
    (UserModel.crear as any).mockResolvedValue({ id: 1, rol: "secretaria" });

    const creado = await UsuarioController.crearUsuario(
      {
        nombre: "Secretaria Nueva",
        email: "nueva@test.com",
        password: "contraseñaLarga1",
        rol: "administrador",
      },
      false
    );

    expect((UserModel.crear as any).mock.calls[0][0].rol).toBe("secretaria");
    expect(creado).toBeDefined();
  });
});

describe("UsuarioController.actualizarUsuario", () => {
  it("no deja que alguien se quite a si mismo el acceso a Usuarios", async () => {
    await expect(
      UsuarioController.actualizarUsuario(
        5,
        5,
        {
          nombre: "Jesus",
          rol: "secretaria",
          permisos: ["noticias"],
        },
        true
      )
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("si permite editar a OTRO usuario y quitarle el acceso a Usuarios", async () => {
    (UserModel.actualizar as any).mockResolvedValue({ id: 7 });

    await expect(
      UsuarioController.actualizarUsuario(
        7,
        5,
        {
          nombre: "Otra Persona",
          rol: "secretaria",
          permisos: ["noticias"],
        },
        true
      )
    ).resolves.toBeDefined();
  });

  it("exige el nombre", async () => {
    await expect(
      UsuarioController.actualizarUsuario(
        7,
        5,
        { nombre: "", rol: "secretaria", permisos: [] },
        true
      )
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("no deja que una cuenta sin rol administrador se autoascienda a administrador", async () => {
    (UserModel.actualizar as any).mockResolvedValue({ id: 5, rol: "secretaria" });

    await UsuarioController.actualizarUsuario(
      5,
      5,
      { nombre: "Secretaria", rol: "administrador", permisos: ["usuarios"] },
      false
    );

    expect((UserModel.actualizar as any).mock.calls[0][1].rol).toBe("secretaria");
  });
});

describe("UsuarioController.eliminarUsuario", () => {
  it("no deja que alguien elimine su propia cuenta", async () => {
    await expect(UsuarioController.eliminarUsuario(5, 5)).rejects.toThrow(UsuarioValidationError);
  });

  it("si permite eliminar la cuenta de otro usuario", async () => {
    (UserModel.eliminar as any).mockResolvedValue({ id: 9 });
    await expect(UsuarioController.eliminarUsuario(9, 5)).resolves.toBeDefined();
  });
});

describe("Protección de cuentas de administrador", () => {
  it("una secretaria con permiso 'usuarios' no puede editar a un administrador", async () => {
    (UserModel.obtenerPorId as any).mockResolvedValueOnce({ id: 1, rol: "administrador", activo: true });
    await expect(
      UsuarioController.actualizarUsuario(1, 5, { nombre: "X", password: "nueva-clave-123" }, false)
    ).rejects.toThrow("Solo un administrador");
    expect(UserModel.actualizar).not.toHaveBeenCalled();
  });

  it("una secretaria no puede eliminar ni desactivar a un administrador", async () => {
    (UserModel.obtenerPorId as any).mockResolvedValue({ id: 1, rol: "administrador", activo: true });
    await expect(UsuarioController.eliminarUsuario(1, 5, false)).rejects.toThrow(UsuarioValidationError);
    await expect(UsuarioController.cambiarActivo(1, 5, false, false)).rejects.toThrow(UsuarioValidationError);
    await expect(UsuarioController.cerrarSesiones(1, false)).rejects.toThrow(UsuarioValidationError);
    (UserModel.obtenerPorId as any).mockResolvedValue({ id: 7, rol: "secretaria", activo: true });
  });

  it("un administrador sí puede editar a otro administrador", async () => {
    (UserModel.obtenerPorId as any).mockResolvedValueOnce({ id: 1, rol: "administrador", activo: true });
    (UserModel.actualizar as any).mockResolvedValue({ id: 1 });
    await expect(
      UsuarioController.actualizarUsuario(1, 2, { nombre: "Admin", rol: "administrador" }, true)
    ).resolves.toBeDefined();
  });
});

describe("UsuarioController.cambiarActivo", () => {
  it("no deja desactivar la propia cuenta", async () => {
    await expect(UsuarioController.cambiarActivo(5, 5, false, true)).rejects.toThrow(UsuarioValidationError);
  });

  it("desactiva la cuenta de otro usuario", async () => {
    (UserModel.cambiarActivo as any).mockResolvedValue({ id: 7, activo: false });
    await UsuarioController.cambiarActivo(7, 5, false, true);
    expect(UserModel.cambiarActivo).toHaveBeenCalledWith(7, false);
  });
});
