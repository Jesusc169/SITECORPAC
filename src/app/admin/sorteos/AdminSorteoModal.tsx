"use client";

import { useState, useEffect } from "react";
import styles from "./sorteos.admin.module.css";
import { useSelectorImagenes } from "@/hooks/useSelectorImagenes";
import SelectorImagenes from "@/components/SelectorImagenes/SelectorImagenes";
import InterruptorVisible from "@/components/InterruptorVisible/InterruptorVisible";
import { fechaHoraPeru, partesPeru } from "@/lib/fechas";

/** Valor que se usaba fijo antes de existir el campo; se propone al crear. */
const LUGAR_POR_DEFECTO = "Sede principal SITECORPAC";

interface Premio {
  /** Clave estable de la fila en pantalla (el servidor la ignora) */
  clave: string;
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
}: Readonly<Props>) {
  const emptyForm = {
    id: null as number | null,
    titulo: "",
    descripcion: "",
    lugar: LUGAR_POR_DEFECTO,
    fecha: "",
    hora: "",
    premios: [] as Premio[],
    visible: true,
  };

  const [form, setForm] = useState(emptyForm);
  const selectorImagenes = useSelectorImagenes();

  /* =========================================================
     CARGAR DATOS PARA EDITAR
  ========================================================= */
  useEffect(() => {
    if (initialData) {
      // En hora de Perú: antes se leía en UTC (toISOString) y cada edición
      // corría la hora del sorteo.
      const { fecha, hora } = initialData.fecha_hora
        ? partesPeru(initialData.fecha_hora)
        : { fecha: "", hora: "" };

      setForm({
        id: initialData.id ?? null,
        titulo: initialData.nombre ?? "",
        descripcion: initialData.descripcion ?? "",
        lugar: initialData.lugar?.trim() || LUGAR_POR_DEFECTO,
        fecha,
        hora,
        premios:
          (initialData.premios ?? initialData.sorteo_producto)?.map(
            (p: any) => ({
              clave: crypto.randomUUID(),
              nombre: p.nombre ?? "",
              descripcion: p.descripcion ?? "",
              cantidad: p.cantidad ?? 1,
            })
          ) ?? [],
        visible: initialData.estado !== "INACTIVO",
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
      premios: [...prev.premios, { clave: crypto.randomUUID(), nombre: "", descripcion: "", cantidad: 1 }],
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
      if (!form.titulo || !form.descripcion || !form.lugar.trim() || !form.fecha || !form.hora) {
        alert("Completa todos los campos obligatorios");
        return;
      }

      // Con la zona de Perú explícita: el servidor (UTC) ya no la interpreta como UTC.
      const fechaHora = fechaHoraPeru(form.fecha, form.hora);
      const anio = Number(form.fecha.slice(0, 4));

      const formData = new FormData();

      formData.append("nombre", form.titulo);
      formData.append("descripcion", form.descripcion);
      formData.append("lugar", form.lugar.trim());
      formData.append("fecha_hora", fechaHora);
      formData.append("anio", anio.toString());
      formData.append("estado", form.visible ? "ACTIVO" : "INACTIVO");
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
          <InterruptorVisible
            visible={form.visible}
            onChange={(visible) => setForm((prev) => ({ ...prev, visible }))}
            tipo="sorteo"
            masculino
          />

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="sorteo-titulo">Título</label>
              <input id="sorteo-titulo"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sorteo-fecha">Fecha</label>
              <input id="sorteo-fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sorteo-hora">Hora</label>
              <input id="sorteo-hora"
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="sorteo-lugar">Lugar</label>
              <input
                id="sorteo-lugar"
                name="lugar"
                maxLength={150}
                placeholder="Ej.: Sede principal SITECORPAC"
                value={form.lugar}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="sorteo-descripcion">Descripción</label>
              <textarea id="sorteo-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="sorteo-fotos">Fotos del sorteo (hasta 5)</label>
              <SelectorImagenes selector={selectorImagenes} idEntrada="sorteo-fotos" />
            </div>

            {/* Grupo de varios campos: fieldset + legend (sin borde, como antes) */}
            <fieldset className={`${styles.formGroup} ${styles.fullWidth} ${styles.grupo}`}>
              <legend>Premios</legend>

              {form.premios.map((p, i) => (
                <div key={p.clave} className={styles.premioBox}>
                  <input
                    placeholder="Nombre"
                    aria-label={`Premio ${i + 1}: nombre`}
                    value={p.nombre}
                    onChange={(e) =>
                      updatePremio(i, "nombre", e.target.value)
                    }
                  />
                  <input
                    placeholder="Descripción"
                    aria-label={`Premio ${i + 1}: descripción`}
                    value={p.descripcion}
                    onChange={(e) =>
                      updatePremio(i, "descripcion", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    aria-label={`Premio ${i + 1}: cantidad`}
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
            </fieldset>
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