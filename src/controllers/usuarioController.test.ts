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
      UsuarioController.crearUsuario({
        nombre: "Ana",
        email: "ana@test.com",
        password: "corta1",
      })
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("rechaza un correo que ya tiene cuenta", async () => {
    (UserModel.existeEmail as any).mockResolvedValue(true);

    await expect(
      UsuarioController.crearUsuario({
        nombre: "Ana",
        email: "ana@test.com",
        password: "contraseñaLarga1",
      })
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("exige nombre, correo y contraseña", async () => {
    await expect(
      UsuarioController.crearUsuario({ nombre: "", email: "", password: "" })
    ).rejects.toThrow(UsuarioValidationError);
  });
});

describe("UsuarioController.actualizarUsuario", () => {
  it("no deja que alguien se quite a si mismo el acceso a Usuarios", async () => {
    await expect(
      UsuarioController.actualizarUsuario(5, 5, {
        nombre: "Jesus",
        rol: "secretaria",
        permisos: ["noticias"],
      })
    ).rejects.toThrow(UsuarioValidationError);
  });

  it("si permite editar a OTRO usuario y quitarle el acceso a Usuarios", async () => {
    (UserModel.actualizar as any).mockResolvedValue({ id: 7 });

    await expect(
      UsuarioController.actualizarUsuario(7, 5, {
        nombre: "Otra Persona",
        rol: "secretaria",
        permisos: ["noticias"],
      })
    ).resolves.toBeDefined();
  });

  it("exige el nombre", async () => {
    await expect(
      UsuarioController.actualizarUsuario(7, 5, { nombre: "", rol: "secretaria", permisos: [] })
    ).rejects.toThrow(UsuarioValidationError);
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
