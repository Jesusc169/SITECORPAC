import Link from "next/link";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import BloquesTexto from "@/components/Sitio/BloquesTexto";
import Icono from "@/components/Icono/Icono";
import { MENU } from "@/components/Cabecera/menu";
import { separarEntrada, textoABloques } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

export type BloqueLegal = { id?: number; titulo: string; descripcion: string; imagen?: string | null };

/**
 * Imagen de una página de legislación. "icono" = logos e ilustraciones con
 * fondo blanco (se muestran enteros, con aire alrededor); "foto" = llena el
 * marco recortando los bordes.
 */
export type ImagenLegal = { src: string; alt: string; tipo: "icono" | "foto" };

function Marco({ imagen, className = "" }: Readonly<{ imagen: ImagenLegal; className?: string }>) {
  return (
    <figure className={`${s.marco} ${imagen.tipo === "icono" ? s.marcoIcono : ""} ${className}`}>
      <img src={imagen.src} alt={imagen.alt} loading="lazy" />
    </figure>
  );
}

/**
 * Plantilla de las 5 páginas de legislación (rediseño A+C):
 * - el primer párrafo del primer bloque es la entrada de la página y la
 *   imagen principal va a la derecha, en un marco;
 * - los bloques intermedios van con su título y su imagen al costado (las
 *   listas de artículos se muestran como tarjetas, ver lib/textoRico);
 * - el último bloque ("SITECORPAC y …") va en el recuadro azul "Para ti".
 */
export default function PaginaLegislacion({
  ruta,
  titulo,
  bloques,
  boton,
  principal,
  imagenesBloques = [],
}: Readonly<{
  ruta: string;
  titulo: string;
  bloques: BloqueLegal[];
  boton?: { texto: string; href: string; descarga?: boolean };
  /** Imagen de la cabecera de la página. */
  principal?: ImagenLegal;
  /** Imagen de cada bloque, por posición (la 0 es el primer bloque). */
  imagenesBloques?: (ImagenLegal | undefined)[];
}>) {
  const legislacion = MENU.find((g) => g.titulo === "Legislación laboral")!;
  const [primero, ...siguientes] = bloques;
  const { entrada, resto } = separarEntrada(primero?.descripcion);
  const final = siguientes.length > 0 ? siguientes.at(-1)! : null;
  const intermedios = final ? siguientes.slice(0, -1) : [];
  const imagenFinal = final ? imagenesBloques[bloques.length - 1] : undefined;

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Legislación laboral" }, { texto: titulo }]}
        rotulo="Legislación laboral"
        titulo={titulo}
        entrada={entrada || undefined}
        lateral={principal && <Marco imagen={principal} className={s.marcoHero} />}
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
            {/* El título del primer bloque solo si queda texto debajo (si todo
                el bloque pasó a la entrada, el título quedaría huérfano). */}
            {primero && primero.titulo !== titulo && resto.length > 0 && <h2 className={s.h2}>{primero.titulo}</h2>}
            <BloquesTexto bloques={resto} />

            {intermedios.map((b, i) => {
              const imagen = imagenesBloques[i + 1];
              const partes = textoABloques(b.descripcion);
              // Los párrafos iniciales van junto a la imagen; las listas (y
              // las tarjetas de artículos) siguen debajo a todo el ancho.
              const corte = imagen ? partes.findIndex((p) => p.tipo !== "parrafo") : -1;
              const cabeza = corte === -1 ? partes : partes.slice(0, corte);
              const cola = corte === -1 ? [] : partes.slice(corte);
              return (
                <div key={b.id ?? b.titulo} className={s.bloque}>
                  <div className={imagen ? s.bloqueConImg : ""}>
                    <div className={s.bloqueTexto}>
                      <h2 className={s.h2}>{b.titulo}</h2>
                      <BloquesTexto bloques={cabeza} />
                    </div>
                    {imagen && <Marco imagen={imagen} />}
                  </div>
                  <BloquesTexto bloques={cola} />
                </div>
              );
            })}

            {final && (
              <div className={`${s.navybox} ${imagenFinal ? s.navyboxConImg : ""}`}>
                <div className={s.bloqueTexto}>
                  <span className={s.kick}>Para ti</span>
                  <h2>{final.titulo}</h2>
                  <BloquesTexto bloques={textoABloques(final.descripcion)} />
                </div>
                {imagenFinal && <Marco imagen={imagenFinal} />}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
