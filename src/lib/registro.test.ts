import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    registro_actividad: { create: vi.fn(), deleteMany: vi.fn() },
  },
}));

import prisma from "@/lib/prisma";
import {
  recortarDetalle,
  mensajeDeError,
  idDe,
  textoVisible,
  registrarActividad,
  registrarError,
  depurarRegistroAntiguo,
  RETENCION_REGISTRO_DIAS,
} from "./registro";

const crear = prisma.registro_actividad.create as unknown as ReturnType<typeof vi.fn>;
const borrar = prisma.registro_actividad.deleteMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recortarDetalle", () => {
  it("devuelve null para texto vacío o solo espacios", () => {
    expect(recortarDetalle("")).toBeNull();
    expect(recortarDetalle("   \n ")).toBeNull();
    expect(recortarDetalle(null)).toBeNull();
  });

  it("junta espacios y saltos de línea", () => {
    expect(recortarDetalle("Editó  la\nnoticia")).toBe("Editó la noticia");
  });

  it("recorta a 500 caracteres sin partir un emoji", () => {
    const largo = "😀".repeat(600);
    const r = recortarDetalle(largo) as string;
    expect(Array.from(r)).toHaveLength(500);
    expect(r.endsWith("…")).toBe(true);
    expect(r).not.toContain("�");
  });
});

describe("ayudantes", () => {
  it("mensajeDeError entiende Error, texto y objetos", () => {
    expect(mensajeDeError(new Error("falló"))).toBe("falló");
    expect(mensajeDeError("texto")).toBe("texto");
    expect(mensajeDeError({ a: 1 })).toBe('{"a":1}');
  });

  it("idDe solo acepta ids numéricos", () => {
    expect(idDe({ id: 7 })).toBe(7);
    expect(idDe({ id: "7" })).toBeNull();
    expect(idDe(null)).toBeNull();
  });

  it("textoVisible", () => {
    expect(textoVisible(false)).toBe("no visible en el sitio");
    expect(textoVisible(true)).toBe("visible en el sitio");
  });
});

describe("registrarActividad", () => {
  it("guarda usuario, IP de nginx y nivel por defecto", async () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "200.1.2.3" } });
    await registrarActividad({
      usuario: { id: 3, nombre: "Katty" },
      accion: "editar",
      modulo: "noticias",
      entidadId: 24,
      detalle: "Editó la noticia",
      request: req,
    });
    expect(crear).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: 3,
        usuario: "Katty",
        accion: "editar",
        modulo: "noticias",
        entidadId: 24,
        ip: "200.1.2.3",
        nivel: "info",
      }),
    });
  });

  it("si la base de datos falla, no lanza (la acción principal sigue)", async () => {
    crear.mockRejectedValueOnce(new Error("DB caída"));
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      registrarActividad({ accion: "login", modulo: "sesion" })
    ).resolves.toBeUndefined();
    espia.mockRestore();
  });

  it("registrarError guarda nivel error con el contexto", async () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});
    await registrarError("ferias", "Crear feria", new Error("disco lleno"));
    expect(crear).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accion: "error",
        modulo: "ferias",
        nivel: "error",
        detalle: "Crear feria: disco lleno",
        usuarioId: null,
      }),
    });
    espia.mockRestore();
  });
});

describe("depurarRegistroAntiguo", () => {
  it("borra lo anterior al plazo de retención", async () => {
    borrar.mockResolvedValueOnce({ count: 4 });
    const antes = Date.now();
    expect(await depurarRegistroAntiguo()).toBe(4);
    const limite: Date = borrar.mock.calls[0][0].where.fecha.lt;
    const dias = (antes - limite.getTime()) / 86400000;
    expect(Math.round(dias)).toBe(RETENCION_REGISTRO_DIAS);
  });
});
