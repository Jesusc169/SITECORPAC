/**
 * Limpia el HTML que llega del editor de texto del panel antes de guardarlo
 * y antes de mostrarlo en el sitio: solo quedan las etiquetas y estilos que
 * el editor puede producir (negrita, tamaños, tipos de letra, listas…). Todo
 * lo demás (scripts, eventos onX, iframes, javascript:) se elimina.
 * Solo servidor: sanitize-html no se envía al navegador.
 */
import sanitizeHtml from "sanitize-html";
import { esHtml } from "@/lib/textoRico";

const COLOR = [/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i];

const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "span", "mark"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
    mark: ["style"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(?:left|right|center|justify)$/],
      // Los tamaños del editor van de 12 a 32 px.
      "font-size": [/^(?:1[0-9]|2[0-9]|3[0-6])px$/],
      // Solo nombres de fuente: letras, espacios, comas, comillas y guiones.
      "font-family": [/^[\w\s,"'-]{1,80}$/],
      color: COLOR,
      "background-color": COLOR,
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

export function limpiarHtml(html: string): string {
  return sanitizeHtml(html, OPCIONES).trim();
}

/** HTML del editor → limpio; texto plano antiguo → igual. */
export function limpiarTextoRico<T extends string | null | undefined>(valor: T): T {
  return (esHtml(valor) ? limpiarHtml(valor as string) : valor) as T;
}
