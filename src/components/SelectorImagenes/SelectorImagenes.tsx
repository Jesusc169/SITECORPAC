"use client";

import { useEffect, useState } from "react";
import styles from "./SelectorImagenes.module.css";
import { MAX_FOTOS, type SelectorImagenesState } from "@/hooks/useSelectorImagenes";

interface Props {
  selector: SelectorImagenesState;
}

export default function SelectorImagenes({ selector }: Props) {
  const {
    activas,
    nuevas,
    total,
    principal,
    agregar,
    quitarExistente,
    quitarNueva,
    marcarPrincipalExistente,
    marcarPrincipalNueva,
  } = selector;

  // Object URLs de preview para los archivos nuevos (se liberan al cambiar la lista)
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = nuevas.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevas]);

  const espacioLibre = MAX_FOTOS - total;

  return (
    <div className={styles.wrapper}>
      {total === 0 && <p className={styles.empty}>Aún no has agregado fotos.</p>}

      <div className={styles.grid}>
        {activas.map((img) => {
          const esPrincipal = principal?.tipo === "existente" && principal.id === img.id;
          return (
            <div
              key={`existente-${img.id}`}
              className={`${styles.thumb} ${esPrincipal ? styles.thumbPrincipal : ""}`}
            >
              <img src={img.url} alt="Foto" className={styles.thumbImg} />
              {esPrincipal && <span className={styles.badgePrincipal}>★ Principal</span>}
              <div className={styles.overlay}>
                {!esPrincipal && (
                  <button
                    type="button"
                    className={`${styles.overlayBtn} ${styles.btnPrincipal}`}
                    onClick={() => marcarPrincipalExistente(img.id)}
                  >
                    ★ Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.overlayBtn} ${styles.btnQuitar}`}
                  onClick={() => quitarExistente(img.id)}
                >
                  ✕ Quitar
                </button>
              </div>
            </div>
          );
        })}

        {nuevas.map((_, i) => {
          const esPrincipal = principal?.tipo === "nueva" && principal.index === i;
          const url = previews[i];
          return (
            <div
              key={`nueva-${i}`}
              className={`${styles.thumb} ${esPrincipal ? styles.thumbPrincipal : ""}`}
            >
              {url && <img src={url} alt="Foto nueva" className={styles.thumbImg} />}
              {esPrincipal && <span className={styles.badgePrincipal}>★ Principal</span>}
              <span className={styles.badgeNueva}>nueva</span>
              <div className={styles.overlay}>
                {!esPrincipal && (
                  <button
                    type="button"
                    className={`${styles.overlayBtn} ${styles.btnPrincipal}`}
                    onClick={() => marcarPrincipalNueva(i)}
                  >
                    ★ Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.overlayBtn} ${styles.btnQuitar}`}
                  onClick={() => quitarNueva(i)}
                >
                  ✕ Quitar
                </button>
              </div>
            </div>
          );
        })}

        {espacioLibre > 0 && (
          <label className={styles.addTile}>
            <span className={styles.addTileIcon}>+</span>
            <span>Agregar foto</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) agregar(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <div className={styles.hint}>
        💡 Puedes subir hasta {MAX_FOTOS} fotos ({total}/{MAX_FOTOS}). Pasa el mouse sobre una
        foto para elegirla como <strong>principal</strong> (la que se ve en la portada) o
        quitarla. La principal se marca con ★.
      </div>
    </div>
  );
}
