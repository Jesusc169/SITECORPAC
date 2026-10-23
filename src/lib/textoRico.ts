/**
 * Convierte los textos largos guardados en la base (legislación, noticias,
 * requisitos) en bloques para el diseño A+C: párrafos, listas con check y
 * tarjetas de artículos. Así el texto sigue siendo texto plano en la base
 * y la presentación la decide el sitio.
 */
export type Articulo = { titulo: string; articulo: string; texto: string; destacado: boolean };

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "articulos"; items: Articulo[] };

const VINETA = /^\s*(?:[-•*]|✅|✔️?)\s+/u;
// "Derecho al trabajo (Artículo 22): El trabajo es…"
const ARTICULO = /^(.+?)\s*\((Art[íi]culos?\s[^)]+)\)\s*:\s*(.+)$/i;

/** Quita la viñeta inicial ("- ", "• ", "✅ ") de una línea. */
export function quitarVineta(linea: string): string {
  return linea.replace(VINETA, "").trim();
}

function cerrarLista(items: string[]): Bloque {
  const articulos = items.map((i) => ARTICULO.exec(i));
  if (articulos.every((m) => m !== null)) {
    return {
      tipo: "articulos",
      items: articulos.map((m) => ({
        titulo: m![1].trim(),
        articulo: m![2].trim(),
        texto: m![3].trim(),
        // El artículo de sindicación es el que más le importa al sindicato.
        destacado: /sindica/i.test(m![1]),
      })),
    };
  }
  return { tipo: "lista", items };
}

export function textoABloques(texto: string | null | undefined): Bloque[] {
  const bloques: Bloque[] = [];
  let lista: string[] = [];
  const terminarLista = () => {
    if (lista.length) bloques.push(cerrarLista(lista));
    lista = [];
  };

  for (const cruda of (texto ?? "").split(/\r?\n/)) {
    const linea = cruda.trim();
    // Las líneas en blanco no cortan una lista: en la base los ítems suelen
    // venir separados por una línea vacía.
    if (!linea) continue;
    if (VINETA.test(linea)) {
      lista.push(quitarVineta(linea));
    } else {
      terminarLista();
      bloques.push({ tipo: "parrafo", texto: linea });
    }
  }
  terminarLista();
  return bloques;
}

/** Separa el primer párrafo (para la entrada de la página) del resto. */
export function separarEntrada(texto: string | null | undefined): { entrada: string; resto: Bloque[] } {
  const bloques = textoABloques(texto);
  const i = bloques.findIndex((b) => b.tipo === "parrafo");
  if (i === -1) return { entrada: "", resto: bloques };
  const entrada = (bloques[i] as { texto: string }).texto;
  return { entrada, resto: bloques.filter((_, j) => j !== i) };
}

/**
 * Requisito del tipo "Enviar … al correo x@y.pe con asunto: TEXTO." → datos
 * para mostrar el correo y el asunto con botón de copiar. null si no aplica.
 */
export function correoYAsunto(texto: string): { correo: string; asunto: string } | null {
  const correo = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(texto)?.[0];
  const asunto = /asunto\s*:\s*(.+?)\.?\s*$/i.exec(texto)?.[1];
  return correo && asunto ? { correo, asunto: asunto.trim() } : null;
}

/*
 * Texto con formato (editor del panel): noticias, ferias y sorteos guardan
 * HTML. Los textos antiguos siguen siendo texto plano y se distinguen porque
 * el editor siempre empieza con un bloque (<p>, <h2>, <ul>…).
 */
const INICIO_HTML = /^\s*<(?:p|h[1-6]|ul|ol|blockquote)[\s>]/i;

export function esHtml(texto: string | null | undefined): boolean {
  return INICIO_HTML.test(texto ?? "");
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/** Texto sin etiquetas (resúmenes, búsquedas, validar que no esté vacío). */
export function htmlATexto(texto: string | null | undefined): string {
  if (!esHtml(texto)) return (texto ?? "").trim();
  return (texto as string)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTIDADES[e])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Texto plano antiguo → HTML para abrirlo en el editor sin perder párrafos ni listas. */
export function textoAHtml(texto: string | null | undefined): string {
  if (esHtml(texto)) return texto as string;
  return textoABloques(texto)
    .map((b) => {
      if (b.tipo === "parrafo") return `<p>${escapar(b.texto)}</p>`;
      const items =
        b.tipo === "lista" ? b.items : b.items.map((a) => `${a.titulo} (${a.articulo}): ${a.texto}`);
      return `<ul>${items.map((i) => `<li><p>${escapar(i)}</p></li>`).join("")}</ul>`;
    })
    .join("");
}
