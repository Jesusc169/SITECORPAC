"use client";

import { useState } from "react";
import styles from "./sorteos.admin.module.css";
import AdminSorteoModal from "./AdminSorteoModal";

// =========================
// Tipos
// =========================
export interface Sorteo {
  id: number;
  nombre: string;
  descripcion: string;
  lugar: string;
  fecha_hora: string;
  anio: number;
  estado: "ACTIVO" | "INACTIVO";
}

interface SorteosAdminViewProps {
  sorteos: Sorteo[];
  onNuevo: () => void;
  onEditar: (s: Sorteo) => void;
  onEliminar: (id: number) => Promise<void>;
  onDuplicar: (id: number) => Promise<void>;
  modal: boolean;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  selected: Sorteo | null;
  onSave: () => Promise<void>;
}

// =========================
// Componente
// =========================
export default function SorteosAdminView({
  sorteos,
  onNuevo,
  onEditar,
  onEliminar,
  onDuplicar,
  modal,
  setModal,
  selected,
  onSave,
}: SorteosAdminViewProps) {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Administración de Sorteos</h1>
          <p>Gestione los sorteos organizados por el SITECORPAC</p>
        </div>

        <button className={styles.newBtn} onClick={onNuevo}>
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
                        s.estado === "ACTIVO" ? styles.active : styles.inactive
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.edit}`}
                        onClick={() => onEditar(s)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.duplicate}`}
                        onClick={() => onDuplicar(s.id)}
                      >
                        📄
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.delete}`}
                        onClick={() => onEliminar(s.id)}
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

      {modal && (
        <AdminSorteoModal
          sorteo={selected}
          onClose={() => setModal(false)}
          onSaved={onSave}
        />
      )}
    </section>
  );
}
