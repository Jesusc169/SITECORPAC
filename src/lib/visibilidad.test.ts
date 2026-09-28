import { describe, it, expect } from "vitest";
import { leerVisible } from "./visibilidad";

function fd(campos: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.append(k, v);
  return f;
}

describe("leerVisible", () => {
  it("es visible por defecto si el formulario no manda el campo", () => {
    expect(leerVisible(fd({}))).toBe(true);
  });

  it("queda oculto solo con el valor \"false\"", () => {
    expect(leerVisible(fd({ activo: "false" }))).toBe(false);
    expect(leerVisible(fd({ activo: "true" }))).toBe(true);
  });

  it("permite leer otro nombre de campo (ferias usan \"estado\")", () => {
    expect(leerVisible(fd({ estado: "false" }), "estado")).toBe(false);
  });
});
