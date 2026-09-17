"use client";

import { useState, useEffect } from "react";
import styles from "./sorteos.admin.module.css";
import { useSelectorImagenes } from "@/hooks/useSelectorImagenes";
import SelectorImagenes from "@/components/SelectorImagenes/SelectorImagenes";

interface Premio {
  nombre: string;
  descripcion: string;
  cantidad: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (id: number | null, formData: FormData) => Promise<void>;
  initialData?: any;
}

export default function AdminSorteoModal({
  open,
  onClose,
  onSave,
  initialData,
}: Props) {
  const emptyForm = {
    id: null as number | null,
    titulo: "",
    descripcion: "",
    fecha: "",
    hora: "",
    premios: [] as Premio[],
  };

  const [form, setForm] = useState(emptyForm);
  const selectorImagenes = useSelectorImagenes();

  /* =========================================================
     CARGAR DATOS PARA EDITAR
  ========================================================= */
  useEffect(() => {
    if (initialData) {
      const fechaISO = initialData.fecha_hora
        ? new Date(initialData.fecha_hora).toISOString()
        : "";

      setForm({
        id: initialData.id ?? null,
        titulo: initialData.nombre ?? "",
        descripcion: initialData.descripcion ?? "",
        fecha: fechaISO ? fechaISO.split("T")[0] : "",
        hora: fechaISO ? fechaISO.split("T")[1].slice(0, 5) : "",
        premios:
          (initialData.premios ?? initialData.sorteo_producto)?.map(
            (p: any) => ({
              nombre: p.nombre ?? "",
              descripcion: p.descripcion ?? "",
              cantidad: p.cantidad ?? 1,
            })
          ) ?? [],
      });
      selectorImagenes.resetear(
        Array.isArray(initialData.sorteo_imagen)
          ? initialData.sorteo_imagen.map((img: any) => ({ id: img.id, url: img.url }))
          : []
      );
    } else {
      setForm(emptyForm);
      selectorImagenes.resetear([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  if (!open) return null;

  /* =========================================================
     MANEJO DE CAMPOS
  ========================================================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value ?? "" }));
  };

  /* =========================================================
     PREMIOS
  ========================================================= */
  const addPremio = () =>
    setForm((prev) => ({
      ...prev,
      premios: [...prev.premios, { nombre: "", descripcion: "", cantidad: 1 }],
    }));

  const updatePremio = (i: number, field: string, value: any) => {
    const nuevos = [...form.premios];
    nuevos[i] = {
      ...nuevos[i],
      [field]: field === "cantidad" ? Number(value) : value,
    };
    setForm({ ...form, premios: nuevos });
  };

  const deletePremio = (i: number) => {
    const nuevos = [...form.premios];
    nuevos.splice(i, 1);
    setForm({ ...form, premios: nuevos });
  };

  /* =========================================================
     GUARDAR
  ========================================================= */
  const handleSave = async () => {
    try {
      if (!form.titulo || !form.descripcion || !form.fecha || !form.hora) {
        alert("Completa todos los campos obligatorios");
        return;
      }

      const fechaHora = `${form.fecha}T${form.hora}:00`;
      const anio = new Date(form.fecha).getFullYear();

      const formData = new FormData();

      formData.append("nombre", form.titulo);
      formData.append("descripcion", form.descripcion);
      formData.append("lugar", "Sede principal SITECORPAC");
      formData.append("fecha_hora", fechaHora);
      formData.append("anio", anio.toString());
      formData.append("estado", "ACTIVO");
      formData.append("premios", JSON.stringify(form.premios || []));

      if (form.id) {
        // Edición: puede combinar fotos existentes + nuevas + eliminaciones.
        selectorImagenes.aplicarAFormData(formData);
      } else {
        // Creación: todas las fotos son nuevas, la principal se manda por índice.
        selectorImagenes.aplicarAFormData(formData, {
          principalIndex: "imagenPrincipalIndex",
        });
      }

      // 🔥 CORRECCIÓN CLAVE
      await onSave(form.id, formData);

      onClose();
    } catch (error) {
      console.error(error);
      alert("Error guardando sorteo");
    }
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{form.id ? "Editar Sorteo" : "Nuevo Sorteo"}</h2>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Título</label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Hora</label>
              <input
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Fotos del sorteo (hasta 5)</label>
              <SelectorImagenes selector={selectorImagenes} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Premios</label>

              {form.premios.map((p, i) => (
                <div key={i} className={styles.premioBox}>
                  <input
                    placeholder="Nombre"
                    value={p.nombre}
                    onChange={(e) =>
                      updatePremio(i, "nombre", e.target.value)
                    }
                  />
                  <input
                    placeholder="Descripción"
                    value={p.descripcion}
                    onChange={(e) =>
                      updatePremio(i, "descripcion", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    value={p.cantidad}
                    onChange={(e) =>
                      updatePremio(i, "cantidad", e.target.value)
                    }
                  />
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deletePremio(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={addPremio}
                className={styles.secondaryBtn}
                style={{ marginTop: 12 }}
              >
                + Agregar premio
              </button>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.primaryBtn} onClick={handleSave}>
            Guardar Sorteo
          </button>
        </div>
      </div>
    </div>
  );
}