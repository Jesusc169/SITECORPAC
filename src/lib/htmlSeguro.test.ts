import { describe, it, expect } from "vitest";
import { limpiarHtml, limpiarTextoRico } from "./htmlSeguro";

describe("limpiarHtml", () => {
  it("conserva el formato que produce el editor", () => {
    const html =
      '<h2 style="text-align: center">Título</h2>' +
      '<p><strong>negrita</strong> <em>cursiva</em> <u>sub</u> <s>tachado</s> <mark>resaltado</mark></p>' +
      '<p><span style="font-size: 24px; font-family: &quot;Times New Roman&quot;, serif; color: #a51c1c">grande</span></p>' +
      '<ul><li><p>uno</p></li></ul><ol><li><p>dos</p></li></ol><blockquote><p>cita</p></blockquote>';
    const limpio = limpiarHtml(html);
    for (const parte of ["<h2", "text-align:center", "<strong>", "<em>", "<u>", "<s>", "<mark>", "font-size:24px", "Times New Roman", "color:#a51c1c", "<ul>", "<ol>", "<blockquote>"]) {
      expect(limpio).toContain(parte);
    }
  });

  it("quita scripts, eventos e iframes", () => {
    const limpio = limpiarHtml(
      '<p onclick="alert(1)">hola<script>alert(1)</script><img src=x onerror="alert(1)"><iframe src="https://x"></iframe></p>'
    );
    expect(limpio).toBe("<p>hola</p>");
  });

  it("los enlaces solo pueden ser http, https o mailto y abren en otra pestaña", () => {
    expect(limpiarHtml('<p><a href="javascript:alert(1)">x</a></p>')).toBe('<p><a target="_blank" rel="noopener noreferrer">x</a></p>');
    expect(limpiarHtml('<p><a href="https://corpac.gob.pe">x</a></p>')).toBe(
      '<p><a href="https://corpac.gob.pe" target="_blank" rel="noopener noreferrer">x</a></p>'
    );
  });

  it("descarta estilos fuera de lo permitido", () => {
    const limpio = limpiarHtml(
      '<p style="position: fixed; text-align: center"><span style="font-size: 400px; background: url(javascript:x); color: expression(alert(1))">x</span></p>'
    );
    expect(limpio).toBe('<p style="text-align:center"><span>x</span></p>');
  });
});

describe("limpiarTextoRico", () => {
  it("el texto plano antiguo no se toca", () => {
    expect(limpiarTextoRico("Línea 1\n- punto <b>")).toBe("Línea 1\n- punto <b>");
    expect(limpiarTextoRico(null)).toBeNull();
  });

  it("el HTML del editor se limpia", () => {
    expect(limpiarTextoRico('<p>ok<script>x</script></p>')).toBe("<p>ok</p>");
  });
});
