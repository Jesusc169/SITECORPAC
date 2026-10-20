import Link from "next/link";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import BloquesTexto from "@/components/Sitio/BloquesTexto";
import Icono from "@/components/Icono/Icono";
import { MENU } from "@/components/Cabecera/menu";
import { separarEntrada, textoABloques } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

export type BloqueLegal = { id?: number; titulo: string; descripcion: string; imagen?: string | null };

/**
 * Plantilla de las 5 páginas de legislación (rediseño A+C):
 * - el primer párrafo del primer bloque es la entrada de la página;
 * - los bloques intermedios van con su título (las listas de artículos
 *   se muestran como tarjetas, ver lib/textoRico);
 * - el último bloque ("SITECORPAC y …") va en el recuadro azul "Para ti".
 */
export default function PaginaLegislacion({
  ruta,
  titulo,
  bloques,
  boton,
  lateral,
}: Readonly<{
  ruta: string;
  titulo: string;
  bloques: BloqueLegal[];
  boton?: { texto: string; href: string; descarga?: boolean };
  lateral?: { src: string; alt: string };
}>) {
  const legislacion = MENU.find((g) => g.titulo === "Legislación laboral")!;
  const [primero, ...siguientes] = bloques;
  const { entrada, resto } = separarEntrada(primero?.descripcion);
  const final = siguientes.length > 0 ? siguientes.at(-1)! : null;
  const intermedios = final ? siguientes.slice(0, -1) : [];

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Legislación laboral" }, { texto: titulo }]}
        rotulo="Legislación laboral"
        titulo={titulo}
        entrada={entrada || undefined}
        lateral={lateral && <img className={s.escudo} src={lateral.src} alt={lateral.alt} />}
      >
        {boton && (
          <div className={s.btns}>
            <a className={s.cta} href={boton.href} target="_blank" rel="noopener noreferrer">
              {boton.descarga ? <Icono nombre="descargar" chico /> : null}
              {boton.texto}
              {boton.descarga ? null : <Icono nombre="flecha" chico />}
              <span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </div>
        )}
      </EncabezadoPagina>

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={`${s.ancho} ${s.lay}`}>
          <nav className={s.lnav} aria-label="Legislación laboral">
            <b>Legislación laboral</b>
            {legislacion.enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className={e.href === ruta ? s.on : ""}
                aria-current={e.href === ruta ? "page" : undefined}
              >
                <Icono nombre="documento" chico />
                {e.texto}
              </Link>
            ))}
          </nav>

          <div className={s.prose}>
            {primero && primero.titulo !== titulo && <h2 className={s.h2}>{primero.titulo}</h2>}
            <BloquesTexto bloques={resto} />

            {intermedios.map((b) => (
              <div key={b.id ?? b.titulo} className={s.bloque}>
                <h2 className={s.h2}>{b.titulo}</h2>
                <BloquesTexto bloques={textoABloques(b.descripcion)} />
                {b.imagen && <img className={s.bloqueImg} src={b.imagen} alt="" loading="lazy" />}
              </div>
            ))}

            {final && (
              <div className={s.navybox}>
                <span className={s.kick}>Para ti</span>
                <h2>{final.titulo}</h2>
                <BloquesTexto bloques={textoABloques(final.descripcion)} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
