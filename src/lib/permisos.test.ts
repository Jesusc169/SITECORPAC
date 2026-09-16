import { describe, it, expect } from "vitest";
import { tienePermiso } from "./permisos";

describe("tienePermiso", () => {
  it("un administrador tiene acceso a cualquier seccion, tenga o no el permiso explicito", () => {
    expect(tienePermiso({ rol: "administrador", permisos: [] }, "usuarios")).toBe(true);
    expect(tienePermiso({ rol: "administrador", permisos: null }, "ferias")).toBe(true);
  });

  it("una secretaria solo entra a las secciones listadas en sus permisos", () => {
    const secretaria = { rol: "secretaria", permisos: ["noticias", "ferias"] };
    expect(tienePermiso(secretaria, "noticias")).toBe(true);
    expect(tienePermiso(secretaria, "usuarios")).toBe(false);
  });

  it("sin usuario (sesion invalida), no hay acceso a nada", () => {
    expect(tienePermiso(null, "noticias")).toBe(false);
    expect(tienePermiso(undefined, "noticias")).toBe(false);
  });

  it("si permisos no es un arreglo (dato corrupto), no revienta: simplemente no da acceso", () => {
    expect(tienePermiso({ rol: "secretaria", permisos: "noticias" as any }, "noticias")).toBe(
      false
    );
  });
});
