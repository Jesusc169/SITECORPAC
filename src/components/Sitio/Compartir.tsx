"use client";

import { useState } from "react";
import Icono from "@/components/Icono/Icono";
import s from "@/styles/Sitio.module.css";

/** Botones para compartir una noticia: WhatsApp, Facebook y copiar el enlace. */
export default function Compartir({ url, titulo }: Readonly<{ url: string; titulo: string }>) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue en la barra del navegador.
    }
  };

  return (
    <div className={s.share}>
      <span className={s.lbl}>Compartir</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icono nombre="chat" chico />
        WhatsApp
        <span className="sr-only"> (abre en una pestaña nueva)</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
        <span className="sr-only"> (abre en una pestaña nueva)</span>
      </a>
      <button type="button" onClick={copiar}>
        <Icono nombre={copiado ? "check" : "enlace"} chico />
        <span aria-live="polite">{copiado ? "Enlace copiado" : "Copiar enlace"}</span>
      </button>
    </div>
  );
}
