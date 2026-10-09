"use client";

import { useEffect, useRef } from "react";
import styles from "../noticias.module.css";

export default function ModalEliminarNoticia({
  noticia,
  onClose,
  onSuccess,
  mostrarToast,
}: any) {
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/administrador/noticias/${noticia.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "No se pudo eliminar la noticia");
      }

      onSuccess();
      onClose();
      mostrarToast("exito", "Noticia eliminada correctamente");
    } catch (error) {
      console.error(error);
      mostrarToast(
        "error",
        error instanceof Error ? error.message : "No se pudo eliminar la noticia"
      );
    }
  };

  // <dialog> nativo: fondo oscuro, foco atrapado y Escape los pone el
  // navegador (Escape dispara "close" → onClose).
  const dialogoRef = useRef<HTMLDialogElement>(null);
  // Sin close() al desmontar: en desarrollo React monta dos veces y lo
  // cerraría al instante. Al quitarse del DOM, el navegador lo retira solo.
  useEffect(() => {
    dialogoRef.current?.showModal();
  }, []);
  // Cerrar con close() (y no desmontando) para que el navegador devuelva el
  // foco al botón que abrió la ventana; el evento "close" llama a onClose.
  const cerrar = () => dialogoRef.current?.close();

  return (
    <dialog ref={dialogoRef} className={styles.dialogoEliminar} aria-labelledby="titulo-eliminar" onClose={onClose}>
          <div className="modal-content">
            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title" id="titulo-eliminar">Eliminar noticia</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={cerrar}
              />
            </div>

            {/* BODY */}
            <div className="modal-body">
              ¿Seguro que deseas eliminar{" "}
              <strong>{noticia.titulo}</strong>?
              <p className="text-muted small mb-0 mt-2">
                Se guardará 30 días en la papelera: el administrador puede recuperarla.
              </p>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cerrar}
                autoFocus
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
    </dialog>
  );
}
