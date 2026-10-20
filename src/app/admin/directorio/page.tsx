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

export default function AdminDirectorioPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMiembros = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/administrador/directorio", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al obtener directorio");

      const data: Miembro[] = await res.json();
      setMiembros(data);
    } catch (error) {
      console.error("Error cargando miembros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiembros();
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

        {loading ? (
          <p className={styles.mensaje}>Cargando directorio...</p>
        ) : (
          <div className={styles.listaMiembros}>
            {miembros.length === 0 ? (
              <p className={styles.mensaje}>No hay miembros registrados.</p>
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
