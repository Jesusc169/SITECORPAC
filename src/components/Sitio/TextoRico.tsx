import { esHtml } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

/**
 * Texto de una feria o sorteo: el HTML del editor (ya limpiado en el
 * servidor con lib/htmlSeguro) o el texto plano de antes.
 * Dentro de la tarjeta el nombre ya es <h3>: los títulos del editor
 * (h2/h3) bajan a h4/h5 para no romper el orden de encabezados.
 */
export default function TextoRico({ texto, className = "" }: Readonly<{ texto: string; className?: string }>) {
  if (!esHtml(texto)) return <p className={className}>{texto}</p>;
  const html = texto.replace(/<(\/?)h([23])(?=[\s>])/gi, (_, cierre: string, n: string) => `<${cierre}h${Number(n) + 2}`);
  return <div className={`${className} ${s.rico}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
