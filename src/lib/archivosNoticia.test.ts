import { describe, it, expect } from "vitest";
import { esDocumentoPermitido } from "./archivosNoticia";

function crearArchivo(nombre: string, tipo: string): File {
  return new File(["contenido"], nombre, { type: tipo });
}

describe("esDocumentoPermitido", () => {
  it("acepta PDF, Word e imágenes con su tipo y extensión correctos", () => {
    expect(esDocumentoPermitido(crearArchivo("cronograma.pdf", "application/pdf"))).toBe(true);
    expect(esDocumentoPermitido(crearArchivo("acta.doc", "application/msword"))).toBe(true);
    expect(
      esDocumentoPermitido(
        crearArchivo(
          "acta.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      )
    ).toBe(true);
    expect(esDocumentoPermitido(crearArchivo("escaneo.jpg", "image/jpeg"))).toBe(true);
  });

  it("rechaza un .html con content-type de PDF spoofeado (XSS almacenado vía nginx)", () => {
    // nginx sirve /uploads/** por extensión de archivo, no por lo que dijo el
    // cliente al subirlo — si esto pasara, el .html quedaría servido como
    // text/html público con cualquier <script> que traiga adentro.
    expect(esDocumentoPermitido(crearArchivo("aviso.html", "application/pdf"))).toBe(false);
  });

  it("rechaza un .svg con content-type de imagen permitida spoofeado", () => {
    expect(esDocumentoPermitido(crearArchivo("logo.svg", "image/png"))).toBe(false);
  });

  it("rechaza una extensión permitida si el tipo no coincide con ninguna permitida", () => {
    expect(esDocumentoPermitido(crearArchivo("archivo.pdf", "application/zip"))).toBe(false);
  });

  it("rechaza un archivo sin extensión ni tipo reconocible", () => {
    expect(esDocumentoPermitido(crearArchivo("misterio", ""))).toBe(false);
  });
});
