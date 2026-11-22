import { describe, expect, it } from "vitest";
import { fotosPrincipalPrimero } from "./fotosGaleria";

const foto = (url: string, principal = false) => ({ url, principal });

describe("fotosPrincipalPrimero", () => {
  it("sin galería ni respaldo devuelve una lista vacía", () => {
    expect(fotosPrincipalPrimero(undefined)).toEqual([]);
    expect(fotosPrincipalPrimero(null, null)).toEqual([]);
    expect(fotosPrincipalPrimero([], "   ")).toEqual([]);
  });

  it("sin galería usa la imagen antigua", () => {
    expect(fotosPrincipalPrimero([], "/a.jpg")).toEqual(["/a.jpg"]);
  });

  it("pone la principal primero y deja las demás en su orden", () => {
    const imgs = [foto("/1.jpg"), foto("/2.jpg"), foto("/3.jpg", true), foto("/4.jpg")];
    expect(fotosPrincipalPrimero(imgs, "/viejo.jpg")).toEqual(["/3.jpg", "/1.jpg", "/2.jpg", "/4.jpg"]);
  });

  it("sin principal respeta el orden recibido", () => {
    expect(fotosPrincipalPrimero([foto("/b.jpg"), foto("/a.jpg")])).toEqual(["/b.jpg", "/a.jpg"]);
  });

  it("no modifica la lista que recibe", () => {
    const imgs = [foto("/1.jpg"), foto("/2.jpg", true)];
    fotosPrincipalPrimero(imgs);
    expect(imgs.map((i) => i.url)).toEqual(["/1.jpg", "/2.jpg"]);
  });
});
