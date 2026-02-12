"use client";

import { useEffect, useState } from "react";

interface Noticia {
  id: number;
  titulo: string;
  descripcion?: string;
  contenido?: string;
  autor: string;
  imagen?: string | null;
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

  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitulo(noticia.titulo);
    setDescripcion(noticia.descripcion || "");
    setContenido(noticia.contenido || "");
    setAutor(noticia.autor);
    setImagenActual(noticia.imagen || null);
    setPreview(noticia.imagen || null);
  }, [noticia]);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagenNueva(file);
    setPreview(URL.createObjectURL(file));
  };

  const actualizarNoticia = async () => {
    if (!titulo.trim()) return alert("El título es obligatorio");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("contenido", contenido);
      formData.append("autor", autor);

      if (imagenNueva) {
        formData.append("imagen", imagenNueva);
      }

      const res = await fetch(`/api/administrador/noticias/${noticia.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al actualizar");

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
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">

          {/* HEADER */}
          <div className="modal-header bg-light border-bottom">
            <h5 className="modal-title fw-bold">
              ✏️ Editar noticia
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* BODY */}
          <div className="modal-body">

            <div className="mb-3">
              <label className="form-label fw-semibold">Título</label>
              <input
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
                <label className="form-label fw-semibold">
                  Cambiar imagen (opcional)
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImagen}
                />
              </div>
            </div>

            {/* PREVIEW */}
            {preview && (
              <div className="mt-4 text-center">
                <p className="fw-semibold mb-2">Vista previa</p>
                <img
                  src={preview}
                  alt="preview"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: "260px" }}
                />
              </div>
            )}

            {!preview && (
              <div className="text-muted small mt-2">
                Sin imagen actualmente
              </div>
            )}

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
