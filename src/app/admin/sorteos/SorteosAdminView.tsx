"use client";

import styles from "./sorteos.admin.module.css";
import EtiquetaVisible from "@/components/InterruptorVisible/EtiquetaVisible";
import { formatearFechaHoraPeru } from "@/lib/fechas";
import panel from "@/styles/PanelAdmin.module.css";

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
  sorteo_imagen?: { id: number; url: string; principal: boolean }[];
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
}: Readonly<SorteosAdminViewProps>) {
  return (
    <section className={styles.container}>
      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <div>
          <h1>Administración de Sorteos</h1>
          <p>Gestione los sorteos del sindicato</p>
        </div>

        <button className={panel.botonNuevo} onClick={onNuevo}>
          + Nuevo Sorteo
        </button>
      </header>

      {/* ================= TABLA ================= */}
      <div className={panel.contenedorTabla}>
          <table className={panel.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Año</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Estado</th>
                <th>Acciones</th>
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
                        ? formatearFechaHoraPeru(s.fecha_hora)
                        : "-"}
                    </td>

                    <td>{s.lugar ? s.lugar : "SITECORPAC"}</td>

                    <td>
                      <EtiquetaVisible visible={s.estado !== "INACTIVO"} masculino />
                    </td>

                    {/* ================= ACCIONES ================= */}
                    <td>
                      <div className={panel.acciones}>
                        {/* EDITAR */}
                        <button
                          className={panel.botonIcono}
                          onClick={() => onEditar(s)}
                          title="Editar"
                          aria-label={`Editar ${s.nombre}`}
                        >
                          ✏️
                        </button>

                        {/* DUPLICAR */}
                        <button
                          className={panel.botonIcono}
                          onClick={() => s.id && onDuplicar(s.id)}
                          title="Duplicar"
                          aria-label={`Duplicar ${s.nombre}`}
                        >
                          📄
                        </button>

                        {/* ELIMINAR */}
                        <button
                          className={`${panel.botonIcono} ${panel.botonPeligro}`}
                          onClick={() => s.id && onEliminar(s.id)}
                          title="Eliminar"
                          aria-label={`Eliminar ${s.nombre}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={panel.vacio}>
                    No hay sorteos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </section>
  );
}