"use client";

import { useEffect, useState } from "react";
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

export default function NoticiasHome({ noticias = [] }: Props) {
  const [indexActual, setIndexActual] = useState(0);

  useEffect(() => {
    if (!noticias.length) return;

    const interval = setInterval(() => {
      setIndexActual((prev) =>
        prev === noticias.length - 1 ? 0 : prev + 1
      );
    }, 18000);

    return () => clearInterval(interval);
  }, [noticias]);

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
          <div className={styles.carruselWrapper}>
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
                    <img
                      src={noticia.imagen}
                      alt={noticia.titulo}
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
          </div>

          {/* INDICADORES */}
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
