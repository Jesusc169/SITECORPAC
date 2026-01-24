"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCrearNoticia({ onClose, onSuccess }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contenido, setContenido] = useState("");
  const [autor, setAutor] = useState("SITECORPAC");

  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const crearNoticia = async () => {
    if (!titulo.trim()) return alert("El título es obligatorio");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("contenido", contenido);
      formData.append("autor", autor);

      if (imagen) {
        formData.append("imagen", imagen);
      }

      await fetch("/api/administrador/noticias", {
        method: "POST",
        body: formData,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al crear la noticia");
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
          <div className="modal-header bg-light">
            <h5 className="modal-title fw-bold">
              📰 Nueva Noticia
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* BODY */}
          <div className="modal-body">

            <div className="mb-3">
              <label className="form-label fw-semibold">Título</label>
              <input
                className="form-control"
                placeholder="Título de la noticia"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Descripción breve</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Resumen corto para la portada"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Contenido</label>
              <textarea
                className="form-control"
                rows={6}
                placeholder="Contenido completo de la noticia"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Autor</label>
                <input
                  className="form-control"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Imagen</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImagen}
                />
              </div>
            </div>

            {/* PREVIEW IMAGEN */}
            {preview && (
              <div className="mt-3 text-center">
                <p className="fw-semibold mb-2">Vista previa</p>
                <img
                  src={preview}
                  alt="Preview"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: "260px" }}
                />
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="btn btn-success"
              onClick={crearNoticia}
              disabled={loading}
            >
              {loading ? "Publicando..." : "Publicar noticia"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
