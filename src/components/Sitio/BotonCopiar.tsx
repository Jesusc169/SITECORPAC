"use client";

import { useState } from "react";
import Icono from "@/components/Icono/Icono";
import s from "@/styles/Sitio.module.css";

/** Copia un texto al portapapeles y confirma con "Copiado" (anunciado al lector de pantalla). */
export default function BotonCopiar({ texto, etiqueta }: Readonly<{ texto: string; etiqueta: string }>) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (navegador antiguo o http): el texto
      // sigue visible al lado para copiarlo a mano.
    }
  };

  return (
    <button type="button" className={s.copy} onClick={copiar} aria-label={etiqueta}>
      <Icono nombre={copiado ? "check" : "copiar"} chico />
      <span aria-live="polite">{copiado ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
