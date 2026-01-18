"use client";

import { useEffect, useState } from "react";
import styles from "./sorteos.admin.module.css";
import AdminSorteoModal from "./AdminSorteoModal";

export default function SorteosAdminView() {
  const [sorteos, setSorteos] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [sorteoEdit, setSorteoEdit] = useState<any>(null);

  const cargarSorteos = async () => {
    const res = await fetch("/api/administrador/sorteos");
    const data = await res.json();
    setSorteos(data);
  };

  useEffect(() => {
    cargarSorteos();
  }, []);

  const abrirNuevo = () => {
    setSorteoEdit(null);
    setModalOpen(true);
  };

  const editar = (sorteo: any) => {
    setSorteoEdit(sorteo);
    setModalOpen(true);
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este sorteo?")) return;
    await fetch(`/api/administrador/sorteos/${id}`, { method: "DELETE" });
    cargarSorteos();
  };

  const duplicar = async (id: number) => {
    await fetch(`/api/administrador/sorteos/${id}/duplicar`, {
      method: "POST",
    });
    cargarSorteos();
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Administración de Sorteos</h1>
          <p>Gestione los sorteos organizados por el SITECORPAC</p>
        </div>

        <button className={styles.newBtn} onClick={abrirNuevo}>
          + Nuevo Sorteo
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Año</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Estado</th>
                <th className={styles.actionsHeader}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {sorteos.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>{s.anio}</td>
                  <td>{new Date(s.fecha_hora).toLocaleString()}</td>
                  <td>{s.lugar}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        s.estado === "ACTIVO"
                          ? styles.active
                          : styles.inactive
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.edit}`}
                        onClick={() => editar(s)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.duplicate}`}
                        onClick={() => duplicar(s.id)}
                      >
                        📄
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.delete}`}
                        onClick={() => eliminar(s.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sorteos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                    No hay sorteos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <AdminSorteoModal
          sorteo={sorteoEdit}
          onClose={() => setModalOpen(false)}
          onSaved={cargarSorteos}
        />
      )}
    </section>
  );
}
