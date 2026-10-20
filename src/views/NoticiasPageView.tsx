"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Afiche from "@/components/Sitio/Afiche";
import Icono from "@/components/Icono/Icono";
import { fechaCorta, partesPeru } from "@/lib/fechas";
import s from "@/styles/Sitio.module.css";

interface NoticiaFromApi {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  fecha: string;
}

/** Sin tildes ni mayúsculas, para que "negociacion" encuentre "Negociación". */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function anioDe(fecha: string) {
  return Number(partesPeru(fecha).fecha.slice(0, 4)) || null;
}

export default function NoticiasPageView({
  noticias,
}: Readonly<{
  noticias: NoticiaFromApi[];
}>) {
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState<number | null>(null);

  const anios = useMemo(
    () =>
      Array.from(new Set(noticias.map((n) => anioDe(n.fecha)).filter((a): a is number => a !== null))).sort(
        (a, b) => b - a
      ),
    [noticias]
  );

  const termino = normalizar(busqueda.trim());
  const visibles = noticias.filter(
    (n) =>
      (anio === null || anioDe(n.fecha) === anio) &&
      (!termino || normalizar(`${n.titulo} ${n.descripcion}`).includes(termino))
  );

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Noticias" }]}
        rotulo="Lo último"
        titulo="Noticias"
        entrada="Comunicados y actividades del sindicato."
      />

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          <div className={s.tools}>
            <label className={s.search}>
              <Icono nombre="buscar" chico />
              <span className="sr-only">Buscar noticias</span>
              <input
                type="search"
                placeholder="Buscar noticias…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
            {anios.length > 0 && (
              <fieldset className={s.chips} aria-label="Filtrar noticias por año">
                <button
                  type="button"
                  className={`${s.chip} ${anio === null ? s.chipOn : ""}`}
                  aria-pressed={anio === null}
                  onClick={() => setAnio(null)}
                >
                  Todas
                </button>
                {anios.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`${s.chip} ${anio === a ? s.chipOn : ""}`}
                    aria-pressed={anio === a}
                    onClick={() => setAnio(a)}
                  >
                    {a}
                  </button>
                ))}
              </fieldset>
            )}
          </div>

          <p className="sr-only" aria-live="polite">
            {visibles.length === 1 ? "1 noticia" : `${visibles.length} noticias`}
          </p>

          <h2 className="sr-only">Listado de noticias</h2>
          {visibles.length === 0 ? (
            <p className={s.estado}>
              {noticias.length === 0 ? "No hay noticias disponibles en este momento." : "Ninguna noticia coincide con la búsqueda."}
            </p>
          ) : (
            <div className={s.ngrid}>
              {visibles.map((n, i) => (
                <article key={n.id}>
                  <Link className={s.nc} href={`/actividades/noticias/${n.id}`}>
                    <Afiche src={n.imagen} alt={n.titulo} prioridad={i < 2} />
                    <p className={s.date}>{fechaCorta(n.fecha)}</p>
                    <h3>{n.titulo}</h3>
                    {n.descripcion && <p className={s.resumen}>{n.descripcion}</p>}
                    <span className={s.go}>
                      Leer más <Icono nombre="flecha" chico />
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
