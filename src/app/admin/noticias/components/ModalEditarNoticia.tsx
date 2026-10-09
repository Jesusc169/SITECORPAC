"use client";

import { useEffect, useState } from "react";
import { useSelectorImagenes } from "@/hooks/useSelectorImagenes";
import SelectorImagenes from "@/components/SelectorImagenes/SelectorImagenes";
import InterruptorVisible from "@/components/InterruptorVisible/InterruptorVisible";

interface NoticiaPdf {
  id: number;
  url: string;
  nombre: string;
}

interface NoticiaImagen {
  id: number;
  url: string;
  principal: boolean;
}

interface Noticia {
  id: number;
  titulo: string;
  descripcion?: string;
  contenido?: string;
  autor: string;
  activo?: boolean;
  imagen?: string | null;
  noticia_pdf?: NoticiaPdf[];
  noticia_imagen?: NoticiaImagen[];
}

interface Props {
  noticia: Noticia;
  onClose: () => void;
  onSuccess: () => void;
  mostrarToast: (tipo: "exito" | "error", texto: string) => void;
}

export default function ModalEditarNoticia({
  noticia,
  onClose,
  onSuccess,
  mostrarToast,
}: Readonly<Props>) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contenido, setContenido] = useState("");
  const [autor, setAutor] = useState("");
  const [activo, setActivo] = useState(true);

  const selectorImagenes = useSelectorImagenes();

  const [pdfsExistentes, setPdfsExistentes] = useState<NoticiaPdf[]>([]);
  const [pdfsAEliminar, setPdfsAEliminar] = useState<number[]>([]);
  const [pdfsNuevos, setPdfsNuevos] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitulo(noticia.titulo);
    setDescripcion(noticia.descripcion ?? "");
    setContenido(noticia.contenido ?? "");
    setAutor(noticia.autor);
    setActivo(noticia.activo ?? true);
    setPdfsExistentes(noticia.noticia_pdf || []);
    setPdfsAEliminar([]);
    setPdfsNuevos([]);

    selectorImagenes.resetear(
      (noticia.noticia_imagen || []).map((img) => ({ id: img.id, url: img.url }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticia]);

  const pdfsExistentesActivos = pdfsExistentes.filter(
    (p) => !pdfsAEliminar.includes(p.id)
  );
  const pdfsActivosCount = pdfsExistentesActivos.length + pdfsNuevos.length;

  const handlePdfsNuevos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = Array.from(e.target.files || []);
    if (!nuevos.length) return;

    setPdfsNuevos((prev) => {
      const maxNuevos = 5 - pdfsExistentesActivos.length;
      const combinados = [...prev, ...nuevos];
      if (combinados.length > maxNuevos) {
        alert("Máximo 5 documentos por noticia.");
      }
      return combinados.slice(0, Math.max(0, maxNuevos));
    });

    e.target.value = "";
  };

  const quitarPdfExistente = (id: number) => {
    setPdfsAEliminar((prev) => [...prev, id]);
  };

  const quitarPdfNuevo = (index: number) => {
    setPdfsNuevos((prev) => prev.filter((_, i) => i !== index));
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
      formData.append("activo", String(activo));

      selectorImagenes.aplicarAFormData(formData);

      formData.append("pdfsEliminar", JSON.stringify(pdfsAEliminar));
      pdfsNuevos.forEach((file) => formData.append("pdfs", file));

      const res = await fetch(`/api/administrador/noticias/${noticia.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Error al actualizar la noticia");
      }

      onSuccess();
      onClose();
      mostrarToast("exito", "Noticia actualizada correctamente");
    } catch (error) {
      console.error(error);
      mostrarToast(
        "error",
        error instanceof Error ? error.message : "Error al actualizar la noticia"
      );
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

            <InterruptorVisible visible={activo} onChange={setActivo} tipo="noticia" />

            <div className="mb-3">
              <label htmlFor="editar-noticia-titulo" className="form-label fw-semibold">Título</label>
              <input id="editar-noticia-titulo"
                className="form-control"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="editar-noticia-descripcion-breve" className="form-label fw-semibold">Descripción breve</label>
              <textarea id="editar-noticia-descripcion-breve"
                className="form-control"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="editar-noticia-contenido" className="form-label fw-semibold">Contenido</label>
              <textarea id="editar-noticia-contenido"
                className="form-control"
                rows={6}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="editar-noticia-autor" className="form-label fw-semibold">Autor</label>
              <input id="editar-noticia-autor"
                className="form-control"
                style={{ maxWidth: 320 }}
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="editar-noticia-fotos" className="form-label fw-semibold">Fotos (hasta 5)</label>
              <SelectorImagenes selector={selectorImagenes} idEntrada="editar-noticia-fotos" />
            </div>

            <div className="mb-3">
              <label htmlFor="editar-noticia-documentos" className="form-label fw-semibold">
                Documentos adjuntos (opcional, máximo 5)
              </label>
              <input id="editar-noticia-documentos"
                type="file"
                className="form-control"
                accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                multiple
                disabled={pdfsActivosCount >= 5}
                onChange={handlePdfsNuevos}
              />
              <div className="form-text">
                💡 Admite PDF, Word (.doc/.docx) o fotos de documentos
                escaneados (JPG/PNG).
              </div>

              {pdfsExistentesActivos.length > 0 && (
                <ul className="list-group mt-2">
                  {pdfsExistentesActivos.map((p) => (
                    <li
                      key={p.id}
                      className="list-group-item d-flex justify-content-between align-items-center py-1 small"
                    >
                      📄{" "}
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-truncate mx-1"
                      >
                        {p.nombre}
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2"
                        onClick={() => quitarPdfExistente(p.id)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pdfsNuevos.length > 0 && (
                <ul className="list-group mt-2">
                  {pdfsNuevos.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="list-group-item d-flex justify-content-between align-items-center py-1 small"
                    >
                      📄 {file.name} <span className="badge bg-success">nuevo</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2"
                        onClick={() => quitarPdfNuevo(i)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pdfsActivosCount === 0 && (
                <div className="text-muted small mt-1">
                  Sin documentos adjuntos actualmente
                </div>
              )}
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
