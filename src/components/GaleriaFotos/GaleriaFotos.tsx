"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import styles from "./GaleriaFotos.module.css";

interface Props {
  imagenes: string[];
  titulo?: string;
}

// Cuadrícula de fotos adicionales para una página de detalle (ej. noticia
// completa). Al hacer click en cualquiera se abre el visor a pantalla
// completa con navegación entre todas.
export default function GaleriaFotos({ imagenes, titulo }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);

  if (imagenes.length === 0) return null;

  return (
    <div className={styles.seccion}>
      <p className={styles.titulo}>📷 Más fotos</p>
      <div className={styles.grid}>
        {imagenes.map((url, i) => (
          <button
            key={i}
            type="button"
            className={styles.tile}
            onClick={() => setAbierta(i)}
            aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
          >
            <img src={url} alt={`${titulo ?? "Foto"} ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {abierta !== null && (
        <Lightbox
          imagenes={imagenes}
          indiceInicial={abierta}
          titulo={titulo}
          onClose={() => setAbierta(null)}
        />
      )}
    </div>
  );
}
