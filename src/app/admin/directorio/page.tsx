"use client";

import React, { useEffect, useState } from "react";
import styles from "@/app/admin/directorio/AdministradorDirectorio.module.css";

// 🔹 Modales
import ModalAgregarMiembro from "./components/modals/ModalAgregarMiembro";
import ModalEditarMiembro from "./components/modals/ModalEditarMiembro";
import panel from "@/styles/PanelAdmin.module.css";
import { rutaPublica } from "@/lib/rutas";
import EncabezadoPanel from "@/components/PanelAdmin/EncabezadoPanel";
import { fechaCorta } from "@/lib/fechas";
import { jsonOError, mensajeDe } from "@/lib/mensajes";

interface Miembro {
  id: number;
  nombre: string;
  cargo: string;
  correo: string;
  telefono: string;
  fotoUrl?: string | null;
  periodoInicio: string;
  periodoFin?: string | null;
}

/* =========================
   Normalizar URL imagen (relativa:
   funciona igual en local y en producción)
   ========================= */
function getFotoUrl(url?: string | null, refreshKey?: number) {
  if (!url) return "";

  let finalUrl = rutaPublica(url);

  // evitar cache navegador
  if (refreshKey !== undefined) {
    finalUrl += `?v=${refreshKey}`;
  }

  return finalUrl;
}

const ERROR_CARGA =
  "No se pudo cargar el directorio. Recarga la página o inténtalo en unos minutos.";

type ResultadoMiembros = { miembros: Miembro[] } | { error: string };

// Pide el directorio al servidor; nunca lanza: devuelve la lista o el error.
async function pedirMiembros(): Promise<ResultadoMiembros> {
  try {
    const res = await fetch("/api/administrador/directorio", {
      method: "GET",
      cache: "no-store",
    });
    const datos = await jsonOError<unknown>(res, ERROR_CARGA);
    // Un 200 que no trae una lista también es un fallo (no "no hay miembros").
    if (!Array.isArray(datos)) return { error: ERROR_CARGA };
    return { miembros: datos as Miembro[] };
  } catch (e) {
    return { error: mensajeDe(e, ERROR_CARGA) };
  }
}

export default function AdminDirectorioPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Si la carga falla se muestra el aviso y se conserva la lista que había;
  // "cargando" se apaga siempre.
  const aplicarMiembros = (resultado: ResultadoMiembros) => {
    if ("miembros" in resultado) {
      setMiembros(resultado.miembros);
      setErrorCarga("");
    } else {
      setErrorCarga(resultado.error);
    }
    setLoading(false);
  };

  const fetchMiembros = async () => {
    setLoading(true);
    aplicarMiembros(await pedirMiembros());
  };

  // Primera carga: "loading" ya empieza en true y el estado se guarda al
  // llegar la respuesta (en el .then), no de forma síncrona en el efecto.
  useEffect(() => {
    pedirMiembros().then(aplicarMiembros);
  }, []);

  // 🔹 Agregar
  const handleAgregarMiembro = async (formData: FormData) => {
    try {
      const res = await fetch("/api/administrador/directorio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al agregar miembro");

      setShowAgregarModal(false);
      await fetchMiembros();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Error al agregar miembro");
    }
  };

  // 🔹 Editar
  const handleEditarMiembro = async (id: number, formData: FormData) => {
    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al editar miembro");

      setEditarMiembro(null);
      await fetchMiembros();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Error al editar miembro");
    }
  };

  // 🔹 Eliminar
  const handleEliminarMiembro = async (id: number) => {
    if (!confirm("¿Seguro quieres eliminar este miembro?\n\nSe guardará 30 días en la papelera: el administrador puede recuperarlo.")) return;

    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar miembro");

      await fetchMiembros();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    }
  };

  return (
    <>
      <EncabezadoPanel
        titulo="Directorio de Representantes"
        descripcion="Dirigentes que aparecen en Quiénes somos › Directorio, con su cargo y datos de contacto."
      >
        <button className={panel.botonNuevo} onClick={() => setShowAgregarModal(true)}>
          + Agregar Miembro
        </button>
      </EncabezadoPanel>

        {errorCarga && (
          <div role="alert" className={panel.errorBanner}>
            {errorCarga}
          </div>
        )}

        {loading ? (
          <p className={styles.mensaje}>Cargando directorio...</p>
        ) : (
          <div className={styles.listaMiembros}>
            {miembros.length === 0 ? (
              // Si no se pudo cargar no se dice "no hay": el aviso ya lo explica.
              !errorCarga && <p className={styles.mensaje}>No hay miembros registrados.</p>
            ) : (
              miembros.map(miembro => (
                <div key={`${miembro.id}-${refreshKey}`} className={styles.miembroCard}>
                  
                  {/* 🔹 Mostrar imagen si existe */}
                  {miembro.fotoUrl ? (
                    <img
                      src={getFotoUrl(miembro.fotoUrl, refreshKey)}
                      alt={`Foto de ${miembro.nombre}`}
                      className={styles.foto}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.sinFoto}>Sin foto</div>
                  )}

                  <div className={styles.datos}>
                    <span className={styles.cargo}>{miembro.cargo}</span>
                    <h2>{miembro.nombre}</h2>
                    <p>{miembro.correo}</p>
                    <p>{miembro.telefono}</p>
                    <p className={styles.periodo}>
                      Periodo: {fechaCorta(miembro.periodoInicio)}
                      {miembro.periodoFin ? ` – ${fechaCorta(miembro.periodoFin)}` : ""}
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <button className={panel.boton} onClick={() => setEditarMiembro(miembro)}>
                      Editar
                    </button>

                    <button className={panel.botonPeligro} onClick={() => handleEliminarMiembro(miembro.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      {showAgregarModal && (
        <ModalAgregarMiembro
          onClose={() => setShowAgregarModal(false)}
          onSubmit={handleAgregarMiembro}
        />
      )}

      {editarMiembro && (
        <ModalEditarMiembro
          miembro={editarMiembro}
          onClose={() => setEditarMiembro(null)}
          onSubmit={handleEditarMiembro}
        />
      )}
    </>
  );
}
