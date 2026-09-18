"use client";

import { createPortal } from "react-dom";
import styles from "./Toast.module.css";
import type { ToastMensaje } from "./useToast";

interface Props {
  toast: ToastMensaje | null;
  onClose: () => void;
}

// Portal a document.body por la misma razón que Lightbox: si quedara
// anidado dentro de un modal admin, cualquier ancestro con transform
// (ej. una tarjeta con hover) lo encerraría en vez de dejarlo fijo sobre
// toda la pantalla.
export default function Toast({ toast, onClose }: Props) {
  if (!toast) return null;

  return createPortal(
    <div
      className={`${styles.toast} ${toast.tipo === "exito" ? styles.exito : styles.error}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icono}>{toast.tipo === "exito" ? "✓" : "✕"}</span>
      <span className={styles.texto}>{toast.texto}</span>
      <button type="button" className={styles.cerrar} onClick={onClose} aria-label="Cerrar aviso">
        ×
      </button>
    </div>,
    document.body
  );
}
