import { esHtml } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

/**
 * Descripción breve de una noticia en las tarjetas: el HTML del editor
 * compacto (ya limpiado en el servidor con limpiarResumen) o el texto plano
 * de antes.
 */
export default function Resumen({ texto }: Readonly<{ texto: string }>) {
  if (!esHtml(texto)) return <p className={s.resumen}>{texto}</p>;
  return <div className={`${s.resumen} ${s.resumenRico}`} dangerouslySetInnerHTML={{ __html: texto }} />;
}
