"use client";

import { useEffect, useState } from "react";
import EncabezadoPanel from "@/components/PanelAdmin/EncabezadoPanel";

import ModalCrearNoticia from "./components/ModalCrearNoticia";
import ModalEditarNoticia from "./components/ModalEditarNoticia";
import ModalEliminarNoticia from "./components/ModalEliminarNoticia";
import Toast from "@/components/Toast/Toast";
import { useToast } from "@/components/Toast/useToast";
import EtiquetaVisible from "@/components/InterruptorVisible/EtiquetaVisible";
import panel from "@/styles/PanelAdmin.module.css";

/* ===============================
   INTERFACE
================================ */
interface Noticia {
  id: number;
  titulo: string;
  fecha: string;
  autor: string;
  activo?: boolean;
}

/* ===============================
   UTIL → FORMATEAR FECHA
================================ */
function formatearFecha(fecha: string) {
  const date = new Date(fecha);

  if (isNaN(date.getTime())) return "Fecha inválida";

  return date.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ===============================
   CARGA → lista del panel; null si falló (se deja la lista que había)
================================ */
async function pedirNoticias(): Promise<Noticia[] | null> {
  try {
    const res = await fetch("/api/administrador/noticias", {
      method: "GET",
      cache: "no-store", // importante en Next 16
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Error backend:", text);
      return null;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Respuesta inesperada:", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error al cargar noticias:", error);
    return null;
  }
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

  const { toast, mostrarToast, cerrarToast } = useToast();

  const aplicarNoticias = (data: Noticia[] | null) => {
    if (data) setNoticias(data);
  };

  const cargarNoticias = async () => {
    aplicarNoticias(await pedirNoticias());
  };

  // El estado se guarda al llegar la respuesta (en el .then), no de forma
  // síncrona dentro del efecto.
  useEffect(() => {
    pedirNoticias().then(aplicarNoticias);
  }, []);

  return (
    <>
      <Toast toast={toast} onClose={cerrarToast} />

      <EncabezadoPanel
        titulo="Administración de Noticias"
        descripcion="Lo que publiques aquí aparece en la sección Noticias del sitio y en la portada."
      >
        <button
          className={panel.botonNuevo}
          onClick={() => setShowCrear(true)}
        >
          + Nueva noticia
        </button>
      </EncabezadoPanel>

      {/* ===============================
          TABLA
      ================================ */}
      <div className={panel.contenedorTabla}>
      <table className={panel.tabla}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Fecha</th>
            <th>Autor</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {noticias.length === 0 ? (
            <tr>
              <td colSpan={5} className={panel.vacio}>
                No hay noticias registradas
              </td>
            </tr>
          ) : (
            noticias.map((n) => (
              <tr key={n.id}>
                <td>{n.titulo}</td>
                <td>{formatearFecha(n.fecha)}</td>
                <td>{n.autor}</td>
                <td><EtiquetaVisible visible={n.activo ?? true} /></td>
                <td>
                  <div className={panel.acciones}>
                  <button
                    className={panel.boton}
                    onClick={() => {
                      setNoticiaSeleccionada(n);
                      setShowEditar(true);
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className={panel.botonPeligro}
                    onClick={() => {
                      setNoticiaSeleccionada(n);
                      setShowEliminar(true);
                    }}
                  >
                    Eliminar
                  </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* ===============================
          MODALES
      ================================ */}
      {showCrear && (
        <ModalCrearNoticia
          onClose={() => setShowCrear(false)}
          onSuccess={cargarNoticias}
          mostrarToast={mostrarToast}
        />
      )}

      {showEditar && noticiaSeleccionada && (
        <ModalEditarNoticia
          noticia={noticiaSeleccionada}
          onClose={() => setShowEditar(false)}
          onSuccess={cargarNoticias}
          mostrarToast={mostrarToast}
        />
      )}

      {showEliminar && noticiaSeleccionada && (
        <ModalEliminarNoticia
          noticia={noticiaSeleccionada}
          onClose={() => setShowEliminar(false)}
          onSuccess={cargarNoticias}
          mostrarToast={mostrarToast}
        />
      )}
    </>
  );
}