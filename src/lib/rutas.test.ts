import { describe, it, expect } from "vitest";
import { rutaPublica } from "./rutas";

describe("rutaPublica", () => {
  it("deja igual las URL completas y las rutas con /", () => {
    expect(rutaPublica("https://x.pe/a.jpg")).toBe("https://x.pe/a.jpg");
    expect(rutaPublica("/uploads/a.jpg")).toBe("/uploads/a.jpg");
  });

  it("agrega / a las rutas relativas", () => {
    expect(rutaPublica("uploads/a.jpg")).toBe("/uploads/a.jpg");
  });
});
