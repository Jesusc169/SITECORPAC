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
import { jsonOError, mensajeDe } from "@/lib/mensajes";

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
   CARGA → lista del panel o el error (nunca lanza)
================================ */
const ERROR_CARGA =
  "No se pudo cargar la lista de noticias. Recarga la página o inténtalo en unos minutos.";

type ResultadoNoticias = { noticias: Noticia[] } | { error: string };

async function pedirNoticias(): Promise<ResultadoNoticias> {
  try {
    const res = await fetch("/api/administrador/noticias", {
      method: "GET",
      cache: "no-store", // importante en Next 16
    });
    const datos = await jsonOError<unknown>(res, ERROR_CARGA);
    // Un 200 que no trae una lista también es un fallo (no "no hay noticias").
    if (!Array.isArray(datos)) {
      console.error("Noticias: respuesta inesperada", datos);
      return { error: ERROR_CARGA };
    }
    return { noticias: datos as Noticia[] };
  } catch (e) {
    // La persona ve un texto claro; el detalle técnico queda en la consola.
    console.error("Noticias: no se pudo cargar", e);
    return { error: mensajeDe(e, ERROR_CARGA) };
  }
}

/* ===============================
   VIEW
================================ */
export default function NoticiasView() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [noticiaSeleccionada, setNoticiaSeleccionada] =
    useState<Noticia | null>(null);

  const [showCrear, setShowCrear] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  const { toast, mostrarToast, cerrarToast } = useToast();

  // Si la carga falla se muestra el aviso y se conserva la lista que había.
  const aplicarNoticias = (resultado: ResultadoNoticias) => {
    if ("noticias" in resultado) {
      setNoticias(resultado.noticias);
      setErrorCarga("");
    } else {
      setErrorCarga(resultado.error);
    }
  };

  const cargarNoticias = async () => {
    aplicarNoticias(await pedirNoticias());
  };

  // El estado se guarda al llegar la respuesta (en el .then), no de forma
  // síncrona dentro del efecto.
  useEffect(() => {
    // pedirNoticias nunca rechaza (devuelve la lista o el error); si algo falla
    // al aplicarlo, queda en la consola.
    pedirNoticias()
      .then(aplicarNoticias)
      .catch((e: unknown) => console.error("pedirNoticias:", e));
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

      {errorCarga && (
        <div role="alert" className={panel.errorBanner}>
          {errorCarga}
        </div>
      )}

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
            // Si la lista no se pudo cargar no se dice "no hay": el aviso ya lo explica.
            !errorCarga && (
              <tr>
                <td colSpan={5} className={panel.vacio}>
                  No hay noticias registradas
                </td>
              </tr>
            )
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