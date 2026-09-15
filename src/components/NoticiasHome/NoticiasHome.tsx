"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "@/components/NoticiasHome/Noticias.module.css";

interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
}

interface Props {
  noticias?: Noticia[];
}

const MAX_INDICADORES = 8;
const INTERVALO_MS = 18000;

export default function NoticiasHome({ noticias = [] }: Props) {
  const [indexActual, setIndexActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (!noticias.length || pausado) return;

    const prefiereMenosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefiereMenosMovimiento) return;

    const interval = setInterval(() => {
      setIndexActual((prev) =>
        prev === noticias.length - 1 ? 0 : prev + 1
      );
    }, INTERVALO_MS);

    return () => clearInterval(interval);
  }, [noticias, pausado]);

  const irAnterior = () => {
    setIndexActual((prev) => (prev === 0 ? noticias.length - 1 : prev - 1));
  };

  const irSiguiente = () => {
    setIndexActual((prev) => (prev === noticias.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className={styles.noticiasSection}>
      {/* HEADER */}
      <header className={styles.header}>
        <h2 className={styles.titulo}>Noticias SITECORPAC</h2>
        <p className={styles.subtitulo}>
          Mantente informado sobre nuestras actividades, comunicados y acciones
          en defensa de los trabajadores.
        </p>
      </header>

      {!noticias.length ? (
        <p className={styles.sinNoticias}>
          No hay noticias disponibles en este momento.
        </p>
      ) : (
        <>
          {/* CARRUSEL */}
          <div
            className={styles.carruselWrapper}
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            onFocus={() => setPausado(true)}
            onBlur={() => setPausado(false)}
          >
            <div
              className={styles.carrusel}
              style={{
                transform: `translateX(-${indexActual * 100}%)`,
              }}
            >
              {noticias.map((noticia) => (
                <article
                  key={noticia.id}
                  className={styles.noticiaCard}
                  aria-label={`Noticia: ${noticia.titulo}`}
                >
                  <div className={styles.imagenWrapper}>
                    <Image
                      src={noticia.imagen}
                      alt={noticia.titulo}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={styles.imagen}
                    />
                  </div>

                  <div className={styles.contenido}>
                    <h3 className={styles.cardTitulo}>
                      {noticia.titulo}
                    </h3>

                    <p className={styles.descripcion}>
                      {noticia.descripcion}
                    </p>

                    <Link
                      href={`/actividades/noticias/${noticia.id}`}
                      className={styles.verMas}
                    >
                      Leer noticia completa
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {noticias.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.flecha} ${styles.flechaIzq}`}
                  onClick={irAnterior}
                  aria-label="Noticia anterior"
                >
                  <i className="bi bi-chevron-left" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className={`${styles.flecha} ${styles.flechaDer}`}
                  onClick={irSiguiente}
                  aria-label="Siguiente noticia"
                >
                  <i className="bi bi-chevron-right" aria-hidden="true"></i>
                </button>
              </>
            )}
          </div>

          {/* INDICADORES */}
          {noticias.length > 1 && (
            noticias.length <= MAX_INDICADORES ? (
              <div className={styles.indicadores}>
                {noticias.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.indicador} ${
                      i === indexActual ? styles.activo : ""
                    }`}
                    onClick={() => setIndexActual(i)}
                    aria-label={`Ir a noticia ${i + 1}`}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.contador}>
                {indexActual + 1} de {noticias.length}
              </p>
            )
          )}

          {/* VER TODAS */}
          <div className={styles.verTodasWrapper}>
            <Link href="/noticias" className={styles.verTodasBtn}>
              Ver todas las noticias
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
