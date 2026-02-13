"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "@/app/admin/directorio/AdministradorDirectorio.module.css";

// 🔹 Modales
import ModalAgregarMiembro from "./components/modals/ModalAgregarMiembro";
import ModalEditarMiembro from "./components/modals/ModalEditarMiembro";

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

export default function AdminDirectorioPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar miembros desde API
  const fetchMiembros = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/administrador/directorio", {
        method: "GET",
        cache: "no-store", // 🔥 siempre trae desde MySQL real
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

  // 🔹 Agregar miembro
  const handleAgregarMiembro = async (formData: FormData) => {
    try {
      const res = await fetch("/api/administrador/directorio", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al agregar miembro");

      setShowAgregarModal(false);
      await fetchMiembros(); // 🔥 refresca real
    } catch (error) {
      console.error(error);
      alert("Error al agregar miembro");
    }
  };

  // 🔹 Editar miembro
  const handleEditarMiembro = async (id: number, formData: FormData) => {
    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al editar miembro");

      setEditarMiembro(null);
      await fetchMiembros(); // 🔥 refresca real
    } catch (error) {
      console.error(error);
      alert("Error al editar miembro");
    }
  };

  // 🔹 Eliminar miembro
  const handleEliminarMiembro = async (id: number) => {
    if (!confirm("¿Seguro quieres eliminar este miembro?")) return;
    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar miembro");

      await fetchMiembros(); // 🔥 refresca real
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <h1>Directorio de Representantes</h1>

        <button
          className={styles.btnAgregar}
          onClick={() => setShowAgregarModal(true)}
        >
          + Agregar Miembro
        </button>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className={styles.listaMiembros}>
            {miembros.length === 0 ? (
              <p>No hay miembros registrados.</p>
            ) : (
              miembros.map(miembro => (
                <div key={miembro.id} className={styles.miembroCard}>
                  {/* FOTO */}
                  {miembro.fotoUrl ? (
                    <img
                      src={`${miembro.fotoUrl}?t=${Date.now()}`} // 🔥 evita cache
                      alt={miembro.nombre}
                      className={styles.foto}
                    />
                  ) : (
                    <div className={styles.sinFoto}>Sin foto</div>
                  )}

                  <div>
                    <h3>{miembro.nombre}</h3>
                    <p>{miembro.cargo}</p>
                    <p>{miembro.correo}</p>
                    <p>{miembro.telefono}</p>
                    <p>
                      {new Date(miembro.periodoInicio).toLocaleDateString()}{" "}
                      {miembro.periodoFin
                        ? `- ${new Date(miembro.periodoFin).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <button onClick={() => setEditarMiembro(miembro)}>Editar</button>
                    <button onClick={() => handleEliminarMiembro(miembro.id)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* 🔹 Modal agregar */}
      {showAgregarModal && (
        <ModalAgregarMiembro
          onClose={() => setShowAgregarModal(false)}
          onSubmit={handleAgregarMiembro}
        />
      )}

      {/* 🔹 Modal editar */}
      {editarMiembro && (
        <ModalEditarMiembro
          miembro={editarMiembro}
          onClose={() => setEditarMiembro(null)}
          onSubmit={handleEditarMiembro}
        />
      )}
    </div>
  );
}
