"use client";

import { useEffect, useState } from "react";
import styles from "./noticias.module.css";

import ModalCrearNoticia from "./components/ModalCrearNoticia";
import ModalEditarNoticia from "./components/ModalEditarNoticia";
import ModalEliminarNoticia from "./components/ModalEliminarNoticia";

/* ===============================
   INTERFACE
================================ */
interface Noticia {
  id: number;
  titulo: string;
  fecha: string;
  autor: string;
}

/* ===============================
   UTIL → FORMATEAR FECHA
================================ */
function formatearFecha(fecha: string) {
  const date = new Date(fecha);

  return date.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ===============================
   VIEW
================================ */
export default function NoticiasView() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] =
    useState<Noticia | null>(null);

  const [showCrear, setShowCrear] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  const cargarNoticias = async () => {
    try {
      const res = await fetch("/api/administrador/noticias");
      const data = await res.json();
      setNoticias(data);
    } catch (error) {
      console.error("Error al cargar noticias", error);
    }
  };

  useEffect(() => {
    cargarNoticias();
  }, []);

  return (
    <div className={styles.container}>
      {/* ===============================
          HEADER
      ================================ */}
      <div className={styles.header}>
        <h1>Administración de Noticias</h1>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowCrear(true)}
        >
          + Nueva noticia
        </button>
      </div>

      {/* ===============================
          TABLA
      ================================ */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Fecha</th>
            <th>Autor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {noticias.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                No hay noticias registradas
              </td>
            </tr>
          ) : (
            noticias.map((n) => (
              <tr key={n.id}>
                <td>{n.titulo}</td>
                <td>{formatearFecha(n.fecha)}</td>
                <td>{n.autor}</td>
                <td className={styles.actions}>
                  <button
                    onClick={() => {
                      setNoticiaSeleccionada(n);
                      setShowEditar(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.danger}
                    onClick={() => {
                      setNoticiaSeleccionada(n);
                      setShowEliminar(true);
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ===============================
          MODALES
      ================================ */}
      {showCrear && (
        <ModalCrearNoticia
          onClose={() => setShowCrear(false)}
          onSuccess={cargarNoticias}
        />
      )}

      {showEditar && noticiaSeleccionada && (
        <ModalEditarNoticia
          noticia={noticiaSeleccionada}
          onClose={() => setShowEditar(false)}
          onSuccess={cargarNoticias}
        />
      )}

      {showEliminar && noticiaSeleccionada && (
        <ModalEliminarNoticia
          noticia={noticiaSeleccionada}
          onClose={() => setShowEliminar(false)}
          onSuccess={cargarNoticias}
        />
      )}
    </div>
  );
}
