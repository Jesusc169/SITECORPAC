"use client";

import { useEffect, useState } from "react";
import styles from "./Lightbox.module.css";

interface Props {
  imagenes: string[];
  indiceInicial: number;
  titulo?: string;
  onClose: () => void;
}

export default function Lightbox({ imagenes, indiceInicial, titulo, onClose }: Props) {
  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, imagenes.length - 1));
  const [indice, setIndice] = useState(clamp(indiceInicial));

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndice((i) => (i + 1) % imagenes.length);
      if (e.key === "ArrowLeft") setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagenes.length]);

  if (imagenes.length === 0) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titulo || "Galería de fotos"}
    >
      <span className={styles.contador}>
        {indice + 1} / {imagenes.length}
      </span>

      <button className={styles.cerrar} onClick={onClose} aria-label="Cerrar">
        ×
      </button>

      {imagenes.length > 1 && (
        <button
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
          }}
          aria-label="Foto anterior"
        >
          ‹
        </button>
      )}

      <div className={styles.imagenWrap} onClick={(e) => e.stopPropagation()}>
        <img src={imagenes[indice]} alt={titulo || `Foto ${indice + 1}`} className={styles.imagen} />
      </div>

      {imagenes.length > 1 && (
        <button
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            setIndice((i) => (i + 1) % imagenes.length);
          }}
          aria-label="Foto siguiente"
        >
          ›
        </button>
      )}

      {imagenes.length > 1 && (
        <div className={styles.miniaturas} onClick={(e) => e.stopPropagation()}>
          {imagenes.map((url, i) => (
            <div
              key={i}
              className={`${styles.miniatura} ${i === indice ? styles.miniaturaActiva : ""}`}
              onClick={() => setIndice(i)}
            >
              <img src={url} alt={`Miniatura ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
