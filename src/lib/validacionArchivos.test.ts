import { describe, it, expect } from "vitest";
import { validarImagen, nombreArchivoSeguro, ArchivoInvalidoError } from "./validacionArchivos";

function crearArchivo(nombre: string, tipo: string): File {
  return new File(["contenido"], nombre, { type: tipo });
}

describe("validarImagen", () => {
  it("acepta JPG, PNG y WEBP", () => {
    expect(() => validarImagen(crearArchivo("foto.jpg", "image/jpeg"))).not.toThrow();
    expect(() => validarImagen(crearArchivo("foto.png", "image/png"))).not.toThrow();
    expect(() => validarImagen(crearArchivo("foto.webp", "image/webp"))).not.toThrow();
  });

  it("rechaza SVG (puede traer <script> embebido)", () => {
    expect(() => validarImagen(crearArchivo("logo.svg", "image/svg+xml"))).toThrow(
      ArchivoInvalidoError
    );
  });

  it("rechaza HTML disfrazado de imagen", () => {
    expect(() => validarImagen(crearArchivo("pagina.html", "text/html"))).toThrow(
      ArchivoInvalidoError
    );
  });

  it("rechaza un archivo sin tipo MIME reconocible", () => {
    expect(() => validarImagen(crearArchivo("misterio", ""))).toThrow(ArchivoInvalidoError);
  });
});

describe("nombreArchivoSeguro", () => {
  it("descarta cualquier carpeta del nombre original (path traversal)", () => {
    const resultado = nombreArchivoSeguro("../../../etc/passwd");
    expect(resultado).not.toContain("/");
  });

  it("descarta rutas absolutas", () => {
    expect(nombreArchivoSeguro("/etc/passwd")).not.toContain("/");
  });

  it("nunca deja pasar una barra invertida (estilo Windows)", () => {
    const resultado = nombreArchivoSeguro("..\\..\\next.config.ts");
    expect(resultado).not.toContain("\\");
  });

  it("conserva un nombre normal intacto", () => {
    expect(nombreArchivoSeguro("foto-evento_2026.jpg")).toBe("foto-evento_2026.jpg");
  });

  it("reemplaza espacios y caracteres raros por guion bajo", () => {
    expect(nombreArchivoSeguro("mi foto (1).jpg")).toBe("mi_foto__1_.jpg");
  });

  it("nunca devuelve una cadena vacia", () => {
    expect(nombreArchivoSeguro("")).not.toBe("");
    expect(nombreArchivoSeguro("...")).not.toBe("");
  });
});
