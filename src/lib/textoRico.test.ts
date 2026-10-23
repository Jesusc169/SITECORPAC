import { describe, it, expect } from "vitest";
import { textoABloques, separarEntrada, quitarVineta, correoYAsunto, esHtml, htmlATexto, textoAHtml } from "./textoRico";

describe("textoABloques", () => {
  it("sin texto no hay bloques", () => {
    expect(textoABloques(null)).toEqual([]);
    expect(textoABloques("")).toEqual([]);
  });

  it("separa párrafos y agrupa las viñetas en una lista", () => {
    const texto = "Primero.\nSegundo.\n\n- uno\n• dos\n✅ tres\n\nFinal.";
    expect(textoABloques(texto)).toEqual([
      { tipo: "parrafo", texto: "Primero." },
      { tipo: "parrafo", texto: "Segundo." },
      { tipo: "lista", items: ["uno", "dos", "tres"] },
      { tipo: "parrafo", texto: "Final." },
    ]);
  });

  it("los ítems separados por líneas en blanco siguen siendo una sola lista", () => {
    expect(textoABloques("- a\n\n- b\n\nFin")).toEqual([
      { tipo: "lista", items: ["a", "b"] },
      { tipo: "parrafo", texto: "Fin" },
    ]);
  });

  it("una lista seguida de un párrafo sin línea en blanco también se cierra", () => {
    expect(textoABloques("- a\nTexto")).toEqual([
      { tipo: "lista", items: ["a"] },
      { tipo: "parrafo", texto: "Texto" },
    ]);
  });

  it("una lista de artículos se convierte en tarjetas y destaca la sindicación", () => {
    const texto =
      "- Derecho al trabajo (Artículo 22): El trabajo es un deber.\r\n" +
      "- Sindicalización y negociación colectiva (Artículo 28): El Estado reconoce…";
    expect(textoABloques(texto)).toEqual([
      {
        tipo: "articulos",
        items: [
          { titulo: "Derecho al trabajo", articulo: "Artículo 22", texto: "El trabajo es un deber.", destacado: false },
          { titulo: "Sindicalización y negociación colectiva", articulo: "Artículo 28", texto: "El Estado reconoce…", destacado: true },
        ],
      },
    ]);
  });
});

describe("separarEntrada", () => {
  it("saca el primer párrafo y deja el resto", () => {
    expect(separarEntrada("Intro.\n- a\nMás.")).toEqual({
      entrada: "Intro.",
      resto: [{ tipo: "lista", items: ["a"] }, { tipo: "parrafo", texto: "Más." }],
    });
  });

  it("si no hay párrafos la entrada queda vacía", () => {
    expect(separarEntrada("- a")).toEqual({ entrada: "", resto: [{ tipo: "lista", items: ["a"] }] });
  });
});

describe("quitarVineta y correoYAsunto", () => {
  it("quita la viñeta inicial", () => {
    expect(quitarVineta("- Copia de DNI.")).toBe("Copia de DNI.");
    expect(quitarVineta("Sin viñeta")).toBe("Sin viñeta");
  });

  it("reconoce el correo y el asunto de un requisito", () => {
    expect(
      correoYAsunto("- Enviar el documento al correo sitecorpac@corpac.pe con asunto: DOCUMENTO SUCESION INTESTADA - NOMBRE.")
    ).toEqual({ correo: "sitecorpac@corpac.pe", asunto: "DOCUMENTO SUCESION INTESTADA - NOMBRE" });
    expect(correoYAsunto("- Copia de DNI.")).toBeNull();
    expect(correoYAsunto("Escribe a a@b.pe")).toBeNull();
  });
});

describe("texto con formato (editor)", () => {
  it("esHtml reconoce lo que produce el editor y no el texto plano", () => {
    expect(esHtml("<p>hola</p>")).toBe(true);
    expect(esHtml('  <h2 style="text-align:center">x</h2>')).toBe(true);
    expect(esHtml("<ul><li>x</li></ul>")).toBe(true);
    expect(esHtml("Hola <b>mundo</b>")).toBe(false);
    expect(esHtml("<pre>x</pre>")).toBe(false);
    expect(esHtml(null)).toBe(false);
  });

  it("htmlATexto quita etiquetas y respeta los saltos", () => {
    expect(htmlATexto("<p><strong>Hola</strong> &amp; adiós</p><ul><li><p>uno</p></li></ul>")).toBe("Hola & adiós\nuno");
    expect(htmlATexto("<p></p>")).toBe("");
    expect(htmlATexto("  texto plano ")).toBe("texto plano");
    expect(htmlATexto(null)).toBe("");
  });

  it("textoAHtml convierte el texto antiguo en párrafos y listas, escapando", () => {
    expect(textoAHtml("Uno <b>\n- a\n- b")).toBe("<p>Uno &lt;b&gt;</p><ul><li><p>a</p></li><li><p>b</p></li></ul>");
    expect(textoAHtml("<p>ya es html</p>")).toBe("<p>ya es html</p>");
    expect(textoAHtml("")).toBe("");
    // las listas de artículos (legislación) se abren como lista simple
    expect(textoAHtml("- Derecho al trabajo (Artículo 22): El trabajo es un deber")).toBe(
      "<ul><li><p>Derecho al trabajo (Artículo 22): El trabajo es un deber</p></li></ul>"
    );
  });
});
