"use client";

import { useEffect, useState } from "react";
import styles from "./ferias.admin.module.css";
import AdminFeriaModal from "./AdminFeriaModal";

export default function FeriasView() {
  const [ferias, setFerias] = useState<any[]>([]);
  const [empresasDisponibles, setEmpresasDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [feriaSeleccionada, setFeriaSeleccionada] = useState<any>(null);

  /* =========================
     CARGAR FERIAS
     ========================= */
  const fetchFerias = async () => {
    try {
      const res = await fetch("/api/administrador/ferias", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar ferias");

      const data = await res.json();
      setFerias(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error inesperado");
    }
  };

  /* =========================
     CARGAR EMPRESAS
     ========================= */
  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/administrador/empresas", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar empresas");

      const data = await res.json();
      setEmpresasDisponibles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando empresas", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFerias(), fetchEmpresas()]).finally(() =>
      setLoading(false)
    );
  }, []);

  /* =========================
     ACCIONES
     ========================= */
  const handleNuevaFeria = () => {
    setFeriaSeleccionada(null);
    setShowModal(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/administrador/ferias/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al obtener feria");

      const data = await res.json();
      setFeriaSeleccionada(data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar la feria");
    }
  };

  const handleDuplicar = async (id: number) => {
    if (!confirm("¿Deseas duplicar esta feria?")) return;

    await fetch(`/api/ferias/${id}/duplicate`, {
      method: "POST",
    });

    await fetchFerias();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta feria definitivamente?")) return;

    await fetch(`/api/administrador/ferias/${id}`, {
      method: "DELETE",
    });

    await fetchFerias();
  };

  /* =========================
     GUARDAR (FERIA + EMPRESAS + FECHAS)
     ========================= */
  const handleSave = async ({
    formData,
    empresas,
    fechas,
  }: {
    formData: FormData;
    empresas: number[];
    fechas: any[];
  }) => {
    try {
      const isEdit = Boolean(feriaSeleccionada?.id);

      /* =========================
         1. FERIA
         ========================= */
      const res = await fetch(
        isEdit
          ? `/api/administrador/ferias/${feriaSeleccionada.id}`
          : "/api/administrador/ferias",
        {
          method: isEdit ? "PUT" : "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Error al guardar feria");

      const feria = await res.json();
      const feriaId = feria.id;

      /* =========================
         2. EMPRESAS
         ========================= */
      if (isEdit) {
        await fetch(`/api/administrador/ferias/${feriaId}/empresas`, {
          method: "DELETE",
        });
      }

      for (const empresaId of empresas) {
        await fetch(`/api/administrador/ferias/${feriaId}/empresas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empresa_id: empresaId }),
        });
      }

      /* =========================
         3. FECHAS
         ========================= */
      for (const fecha of fechas) {
        if (fecha.id) {
          await fetch(`/api/administrador/fechas/${fecha.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fecha),
          });
        } else {
          await fetch(`/api/administrador/ferias/${feriaId}/fechas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fecha),
          });
        }
      }

      await fetchFerias();
      setShowModal(false);
      setFeriaSeleccionada(null);
    } catch (error) {
      console.error(error);
      alert("Error al guardar la feria");
    }
  };

  /* =========================
     RENDER
     ========================= */
  if (loading) return <p className={styles.loading}>Cargando ferias...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;

  return (
    <>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Administración de Ferias</h1>
          <p className={styles.subtitle}>
            Gestión institucional de ferias
          </p>
        </div>

        <button className={styles.newBtn} onClick={handleNuevaFeria}>
          ➕ Nueva Feria
        </button>
      </div>

      {/* TABLA */}
      <div className={styles.tableWrapper}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Año</th>
              <th>Fecha / Lugar</th>
              <th>Empresas</th>
              <th className={styles.actionsCol}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ferias.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No hay ferias registradas
                </td>
              </tr>
            )}

            {ferias.map((feria) => {
              const fechas = feria.evento_feria_fecha || [];

              const anioRealizado =
                fechas.length > 0
                  ? new Date(fechas[0].fecha).getFullYear()
                  : feria.anio ?? "—";

              return (
                <tr key={feria.id}>
                  {/* NOMBRE */}
                  <td className={styles.nombre}>
                    <strong>{feria.titulo}</strong>
                    {feria.descripcion && (
                      <p className={styles.descripcion}>
                        {feria.descripcion}
                      </p>
                    )}
                  </td>

                  {/* AÑO */}
                  <td className={styles.center}>{anioRealizado}</td>

                  {/* FECHAS */}
                  <td>
                    {fechas.length > 0 ? (
                      <div className={styles.fechasStack}>
                        {fechas.slice(0, 2).map((f: any, index: number) => (
                          <div key={f.id} className={styles.fechaItem}>
                            <strong>Fecha {index + 1}:</strong>{" "}
                            {new Date(f.fecha).toLocaleDateString()}
                            <br />
                            <span className={styles.muted}>
                              📍 {f.ubicacion}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.muted}>Sin fechas</span>
                    )}
                  </td>

                  {/* EMPRESAS */}
                  <td>
                    {feria.evento_feria_empresa?.length ? (
                      <ul className={styles.empresasList}>
                        {feria.evento_feria_empresa.map((e: any) => (
                          <li key={e.id}>{e.empresa?.nombre}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.muted}>No asignadas</span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.iconBtn} ${styles.edit}`}
                        title="Editar"
                        onClick={() => handleEdit(feria.id)}
                      >
                        ✏️
                      </button>

                      <button
                        className={`${styles.iconBtn} ${styles.duplicate}`}
                        title="Duplicar"
                        onClick={() => handleDuplicar(feria.id)}
                      >
                        📄
                      </button>

                      <button
                        className={`${styles.iconBtn} ${styles.delete}`}
                        title="Eliminar"
                        onClick={() => handleDelete(feria.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <AdminFeriaModal
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setFeriaSeleccionada(null);
          }}
          onSave={handleSave}
          feriaData={feriaSeleccionada}
          empresasDisponibles={empresasDisponibles}
        />
      )}
    </>
  );
}
