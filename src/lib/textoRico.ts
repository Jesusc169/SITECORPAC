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
