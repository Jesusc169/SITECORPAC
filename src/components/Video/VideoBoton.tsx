"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReproductorVideo from "./ReproductorVideo";
import styles from "./Video.module.css";
import { textoDuracion } from "@/hooks/useSelectorVideo";
import type { VideoPublico } from "@/lib/videos/vincular";

interface Props {
  video: VideoPublico | null | undefined;
  titulo: string;
  className?: string;
}

/**
 * Botón "▶ Ver video" para las tarjetas de ferias y sorteos (no tienen
 * página propia): abre el video en una ventana a pantalla completa.
 * Igual que el visor de fotos, va en un portal a <body> para que el
 * `transform` del :hover de la tarjeta no lo encierre.
 */
export default function VideoBoton({ video, titulo, className }: Readonly<Props>) {
  const [abierto, setAbierto] = useState(false);
  if (!video) return null;
  const duracion = textoDuracion(video.duracion);
  return (
    <>
      <button type="button" className={className} onClick={() => setAbierto(true)}>
        <span aria-hidden="true">▶</span> Ver video{duracion ? ` (${duracion})` : ""}
      </button>
      {abierto && <VentanaVideo video={video} titulo={titulo} onClose={() => setAbierto(false)} />}
    </>
  );
}

function VentanaVideo({ video, titulo, onClose }: { video: VideoPublico; titulo: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialogo = dialogRef.current;
    if (!dialogo) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previo = document.activeElement as HTMLElement | null;
    if (!dialogo.open) dialogo.showModal();
    cerrarRef.current?.focus();
    const alHacerClic = (e: MouseEvent) => e.target === dialogo && onClose();
    const alCerrar = () => onClose();
    dialogo.addEventListener("click", alHacerClic);
    dialogo.addEventListener("close", alCerrar);
    return () => {
      dialogo.removeEventListener("click", alHacerClic);
      dialogo.removeEventListener("close", alCerrar);
      document.body.style.overflow = original;
      previo?.focus();
    };
  }, [onClose]);

  return createPortal(
    <dialog ref={dialogRef} className={styles.ventana} aria-label={`Video: ${titulo}`}>
      <button ref={cerrarRef} type="button" className={styles.cerrar} onClick={onClose} aria-label="Cerrar video">
        <span aria-hidden="true">×</span>
      </button>
      <div className={styles.marco}>
        <ReproductorVideo video={video} titulo={titulo} autoPlay />
      </div>
      <p className={styles.titulo}>{titulo}</p>
    </dialog>,
    document.body
  );
}
