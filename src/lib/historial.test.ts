import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("@/lib/invalidarCache", () => ({ invalidarCache: vi.fn() }));

import { diferencias, tieneHistorial, CAMPOS_RESTAURABLES } from "./historial";

describe("diferencias", () => {
  it("lista solo los campos que cambiaron y marca cuáles se pueden restaurar", () => {
    const antes = { titulo: "Viejo", descripcion: "igual", activo: true, imagenes: ["/uploads/a.jpg"] };
    const despues = { titulo: "Nuevo", descripcion: "igual", activo: false, imagenes: ["/uploads/b.jpg"] };
    const d = diferencias("noticias", antes, despues);
    expect(d.map((x) => x.campo)).toEqual(["titulo", "activo", "imagenes"]);
    expect(d.find((x) => x.campo === "titulo")?.restaurable).toBe(true);
    expect(d.find((x) => x.campo === "imagenes")?.restaurable).toBe(false);
  });

  it("sin cambios devuelve lista vacía", () => {
    const a = { nombre: "Ana", cargo: "Secretaria" };
    expect(diferencias("directorio", a, { ...a })).toEqual([]);
  });

  it("null y campo ausente cuentan como lo mismo", () => {
    expect(diferencias("noticias", { contenido: null }, {})).toEqual([]);
  });

  it("sin instantánea anterior no hay diferencias", () => {
    expect(diferencias("noticias", null, { titulo: "x" })).toEqual([]);
  });
});

describe("módulos con historial", () => {
  it("noticias, ferias, sorteos y directorio; usuarios no", () => {
    expect(tieneHistorial("noticias")).toBe(true);
    expect(tieneHistorial("directorio")).toBe(true);
    expect(tieneHistorial("usuarios")).toBe(false);
  });

  it("nunca se restauran fotos ni archivos", () => {
    for (const campos of Object.values(CAMPOS_RESTAURABLES)) {
      expect(campos).not.toContain("imagenes");
      expect(campos).not.toContain("imagen");
      expect(campos).not.toContain("fotoUrl");
    }
  });
});
