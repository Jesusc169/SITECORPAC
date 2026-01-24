"use client";

import { useEffect, useState } from "react";

interface Noticia {
  id: number;
  titulo: string;
  descripcion?: string;
  contenido?: string;
  autor: string;
}

interface Props {
  noticia: Noticia;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarNoticia({
  noticia,
  onClose,
  onSuccess,
}: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contenido, setContenido] = useState("");
  const [autor, setAutor] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitulo(noticia.titulo);
    setDescripcion(noticia.descripcion || "");
    setContenido(noticia.contenido || "");
    setAutor(noticia.autor);
  }, [noticia]);

  const actualizarNoticia = async () => {
    if (!titulo.trim()) return alert("El título es obligatorio");

    setLoading(true);

    try {
      await fetch(`/api/administrador/noticias/${noticia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          contenido,
          autor,
        }),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la noticia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg">

          {/* HEADER */}
          <div className="modal-header bg-light border-bottom">
            <h5 className="modal-title fw-bold">
              ✏️ Editar Noticia
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* BODY */}
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">Título</label>
              <input
                type="text"
                className="form-control"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Descripción breve</label>
              <textarea
                className="form-control"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Contenido</label>
              <textarea
                className="form-control"
                rows={6}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Autor</label>
              <input
                type="text"
                className="form-control"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-top">
            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              onClick={actualizarNoticia}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
