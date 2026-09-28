"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Accesibilidad de diálogo modal: al abrir, el foco pasa al botón
    // Cerrar; al cerrar, vuelve al elemento que abrió el visor (si no, quien
    // usa teclado queda "perdido" al inicio de la página).
    const previo = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndice((i) => (i + 1) % imagenes.length);
      if (e.key === "ArrowLeft") setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);

      // Mantiene el foco dentro del visor mientras está abierto.
      if (e.key === "Tab" && dialogRef.current) {
        const enfocables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        if (!enfocables.length) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
      previo?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagenes.length]);

  if (imagenes.length === 0) return null;

  // Portal a document.body: si el lightbox se quedara anidado dentro de la
  // tarjeta que lo abre (feria/sorteo), un simple `transform` en su :hover
  // (ver .feria:hover, .sorteo:hover) convierte a esa tarjeta en el
  // contenedor de este position:fixed, y el visor queda encerrado en la
  // tarjeta en vez de cubrir toda la pantalla.
  return createPortal(
    <div
      ref={dialogRef}
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titulo || "Galería de fotos"}
    >
      <span className={styles.contador} aria-live="polite">
        Foto {indice + 1} de {imagenes.length}
      </span>

      <button
        ref={cerrarRef}
        type="button"
        className={styles.cerrar}
        onClick={onClose}
        aria-label="Cerrar galería"
      >
        <span aria-hidden="true">×</span>
      </button>

      {imagenes.length > 1 && (
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
          }}
          aria-label="Foto anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>
      )}

      <div className={styles.imagenWrap} onClick={(e) => e.stopPropagation()}>
        <img
          src={imagenes[indice]}
          alt={titulo ? `${titulo} — foto ${indice + 1} de ${imagenes.length}` : `Foto ${indice + 1} de ${imagenes.length}`}
          className={styles.imagen}
        />
      </div>

      {imagenes.length > 1 && (
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            setIndice((i) => (i + 1) % imagenes.length);
          }}
          aria-label="Foto siguiente"
        >
          <span aria-hidden="true">›</span>
        </button>
      )}

      {imagenes.length > 1 && (
        <div className={styles.miniaturas} onClick={(e) => e.stopPropagation()}>
          {imagenes.map((url, i) => (
            // Antes era un <div> con onClick: se podía usar con el mouse
            // pero no con el teclado.
            <button
              key={i}
              type="button"
              className={`${styles.miniatura} ${i === indice ? styles.miniaturaActiva : ""}`}
              onClick={() => setIndice(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === indice ? "true" : undefined}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
