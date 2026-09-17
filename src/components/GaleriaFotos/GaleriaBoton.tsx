"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import styles from "./GaleriaFotos.module.css";

interface Props {
  imagenes: string[];
  titulo?: string;
  className?: string;
}

// Botón compacto para tarjetas (ferias, sorteos): abre el álbum completo de
// fotos de ese ítem en un visor a pantalla completa. Solo tiene sentido
// mostrarlo cuando hay más de una foto.
export default function GaleriaBoton({ imagenes, titulo, className }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);

  if (imagenes.length <= 1) return null;

  return (
    <>
      <button
        type="button"
        className={`${styles.boton} ${className ?? ""}`}
        onClick={() => setAbierta(0)}
      >
        📷 Ver {imagenes.length} fotos
      </button>

      {abierta !== null && (
        <Lightbox
          imagenes={imagenes}
          indiceInicial={abierta}
          titulo={titulo}
          onClose={() => setAbierta(null)}
        />
      )}
    </>
  );
}
