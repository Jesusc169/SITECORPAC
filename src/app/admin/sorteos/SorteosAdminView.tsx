"use client";

import styles from "./sorteos.admin.module.css";

/* =========================
TIPOS
========================= */
export interface Premio {
  id?: number;
  nombre: string;
  descripcion?: string;
  sorteo_id?: number;
  cantidad?: number;
}

export interface Sorteo {
  id?: number;
  nombre: string;
  descripcion?: string;
  lugar?: string;
  imagen?: string;
  fecha_hora: string;
  anio: number;
  estado?: "ACTIVO" | "INACTIVO";
  premios?: Premio[];
}

interface SorteosAdminViewProps {
  sorteos: Sorteo[];
  onNuevo: () => void;
  onEditar: (s: Sorteo) => void;
  onEliminar: (id: number) => Promise<void>;
  onDuplicar: (id: number) => Promise<void>;
}

/* =========================
COMPONENTE
========================= */
export default function SorteosAdminView({
  sorteos,
  onNuevo,
  onEditar,
  onEliminar,
  onDuplicar,
}: SorteosAdminViewProps) {
  return (
    <section className={styles.container}>
      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <div>
          <h1>Administración de Sorteos</h1>
          <p>Gestione los sorteos del sindicato</p>
        </div>

        <button className={styles.newBtn} onClick={onNuevo}>
          + Nuevo Sorteo
        </button>
      </header>

      {/* ================= TABLA ================= */}
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
              {sorteos.length > 0 ? (
                sorteos.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nombre}</td>

                    <td>{s.anio ?? "-"}</td>

                    <td>
                      {s.fecha_hora
                        ? new Date(s.fecha_hora).toLocaleString("es-PE")
                        : "-"}
                    </td>

                    <td>{s.lugar || "SITECORPAC"}</td>

                    <td>
                      <span
                        className={`${styles.badge} ${
                          s.estado === "ACTIVO"
                            ? styles.active
                            : styles.inactive
                        }`}
                      >
                        {s.estado || "ACTIVO"}
                      </span>
                    </td>

                    {/* ================= ACCIONES ================= */}
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        {/* EDITAR */}
                        <button
                          className={`${styles.actionBtn} ${styles.edit}`}
                          onClick={() => onEditar(s)}
                          title="Editar"
                        >
                          ✏️
                        </button>

                        {/* DUPLICAR */}
                        <button
                          className={`${styles.actionBtn} ${styles.duplicate}`}
                          onClick={() => s.id && onDuplicar(s.id)}
                          title="Duplicar"
                        >
                          📄
                        </button>

                        {/* ELIMINAR */}
                        <button
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => s.id && onEliminar(s.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                    No hay sorteos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}