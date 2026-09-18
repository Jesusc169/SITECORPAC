"use client";

import { useState } from "react";
import { useSelectorImagenes } from "@/hooks/useSelectorImagenes";
import SelectorImagenes from "@/components/SelectorImagenes/SelectorImagenes";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  mostrarToast: (tipo: "exito" | "error", texto: string) => void;
}

export default function ModalCrearNoticia({ onClose, onSuccess, mostrarToast }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contenido, setContenido] = useState("");
  const [autor, setAutor] = useState("SITECORPAC");

  const selectorImagenes = useSelectorImagenes();

  const [pdfs, setPdfs] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);

  const handlePdfs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = Array.from(e.target.files || []);
    if (!nuevos.length) return;

    setPdfs((prev) => {
      const combinados = [...prev, ...nuevos];
      if (combinados.length > 5) {
        alert("Máximo 5 documentos por noticia. Se tomaron los primeros 5.");
      }
      return combinados.slice(0, 5);
    });

    e.target.value = "";
  };

  const quitarPdf = (index: number) => {
    setPdfs((prev) => prev.filter((_, i) => i !== index));
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

      selectorImagenes.aplicarAFormData(formData, {
        nuevas: "imagenes",
        principalIndex: "imagenPrincipalIndex",
      });

      pdfs.forEach((file) => formData.append("pdfs", file));

      const res = await fetch("/api/administrador/noticias", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "No se pudo crear la noticia");
      }

      onSuccess();
      onClose();
      mostrarToast("exito", "Noticia publicada correctamente");
    } catch (error) {
      console.error(error);
      mostrarToast(
        "error",
        error instanceof Error ? error.message : "Error al crear la noticia"
      );
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

            <div className="mb-3">
              <label className="form-label fw-semibold">Autor</label>
              <input
                className="form-control"
                style={{ maxWidth: 320 }}
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Fotos (hasta 5)</label>
              <SelectorImagenes selector={selectorImagenes} />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Documentos adjuntos (opcional, máximo 5)
              </label>
              <input
                type="file"
                className="form-control"
                accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                multiple
                disabled={pdfs.length >= 5}
                onChange={handlePdfs}
              />
              <div className="form-text">
                💡 Admite PDF, Word (.doc/.docx) o fotos de documentos
                escaneados (JPG/PNG).
              </div>
              {pdfs.length > 0 && (
                <ul className="list-group mt-2">
                  {pdfs.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="list-group-item d-flex justify-content-between align-items-center py-1 small"
                    >
                      📄 {file.name}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2"
                        onClick={() => quitarPdf(i)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
