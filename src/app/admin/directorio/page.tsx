"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar/Sidebar";
import ModalAgregarMiembro from "./components/modals/ModalAgregarMiembro";
import ModalEditarMiembro from "./components/modals/ModalEditarMiembro";
import styles from "@/app/admin/directorio/AdministradorDirectorio.module.css";

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

  // 🔹 Cargar miembros
  const fetchMiembros = async () => {
    try {
      const res = await fetch("/api/administrador/directorio");
      if (!res.ok) throw new Error("Error al obtener directorio");
      const data: Miembro[] = await res.json();
      setMiembros(data);
    } catch (error) {
      console.error(error);
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
      const nuevoMiembro = await res.json();
      setMiembros(prev => [nuevoMiembro, ...prev]);
      setShowAgregarModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Editar miembro (ahora usando FormData también)
  const handleEditarMiembro = async (id: number, formData: FormData) => {
    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al editar miembro");
      const actualizado = await res.json();
      setMiembros(prev => prev.map(m => (m.id === id ? actualizado : m)));
      setEditarMiembro(null);
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Eliminar miembro
  const handleEliminarMiembro = async (id: number) => {
    if (!confirm("¿Seguro quieres eliminar este miembro?")) return;

    try {
      const res = await fetch(`/api/administrador/directorio/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar miembro");
      setMiembros(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error(error);
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

        <div className={styles.listaMiembros}>
          {miembros.length === 0 ? (
            <p>No hay miembros registrados.</p>
          ) : (
            miembros.map(miembro => (
              <div key={miembro.id} className={styles.miembroCard}>
                {miembro.fotoUrl && (
                  <img src={miembro.fotoUrl} alt={miembro.nombre} className={styles.foto} />
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
      </main>

      {/* Modals */}
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
          onSubmit={handleEditarMiembro} // Ahora espera FormData
        />
      )}
    </div>
  );
}
