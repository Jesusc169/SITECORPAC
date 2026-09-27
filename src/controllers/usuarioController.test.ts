import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/UserModel", () => ({
  UserModel: {
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
