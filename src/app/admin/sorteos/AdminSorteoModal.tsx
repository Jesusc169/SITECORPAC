"use client";

import { useState, useEffect } from "react";
import styles from "./sorteos.admin.module.css";

interface Premio {
  nombre: string;
  descripcion: string;
  cantidad: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function AdminSorteoModal({ open, onClose, onSave, initialData }: Props) {
  const emptyForm = {
    id: null,
    titulo: "",
    descripcion: "",
    fecha: "",
    hora: "",
    imagen: "",
    premios: [] as Premio[],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      const fechaISO = initialData.fecha_hora ? new Date(initialData.fecha_hora).toISOString() : "";
      setForm({
        id: initialData.id ?? null,
        titulo: initialData.titulo ?? initialData.nombre ?? "",
        descripcion: initialData.descripcion ?? "",
        fecha: fechaISO ? fechaISO.split("T")[0] : "",
        hora: fechaISO ? fechaISO.split("T")[1].slice(0, 5) : "",
        imagen: initialData.imagen ?? "",
        premios:
          initialData.premios?.map((p: any) => ({
            nombre: p.nombre ?? "",
            descripcion: p.descripcion ?? "",
            cantidad: p.cantidad ?? 1,
          })) ?? [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value ?? "" }));
  };

  const addPremio = () =>
    setForm((prev: any) => ({
      ...prev,
      premios: [...prev.premios, { nombre: "", descripcion: "", cantidad: 1 }],
    }));

  const updatePremio = (i: number, field: string, value: any) => {
    const nuevos = [...form.premios];
    nuevos[i] = { ...nuevos[i], [field]: field === "cantidad" ? Number(value) : value };
    setForm({ ...form, premios: nuevos });
  };

  const deletePremio = (i: number) => {
    const nuevos = [...form.premios];
    nuevos.splice(i, 1);
    setForm({ ...form, premios: nuevos });
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();

      if (data?.url) setForm((prev: any) => ({ ...prev, imagen: data.url }));
      else alert("Error subiendo imagen");
    } catch (err) {
      console.error(err);
      alert("Error subiendo imagen");
    }
  };

  const handleSave = async () => {
    try {
      const fechaHora = form.fecha && form.hora ? `${form.fecha}T${form.hora}:00` : new Date().toISOString();
      const anio = form.fecha ? new Date(form.fecha).getFullYear() : new Date().getFullYear();

      const payload = {
        id: form.id,
        titulo: form.titulo,
        descripcion: form.descripcion,
        lugar: "Sede principal SITECORPAC",
        fecha_hora: fechaHora,
        imagen: form.imagen || null,
        premios: form.premios || [],
        anio, // 💡 nunca será null
        nombre: form.titulo,
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error guardando sorteo");
    }
  };

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
              <input name="titulo" value={form.titulo || ""} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={form.fecha || ""} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Hora</label>
              <input type="time" name="hora" value={form.hora || ""} onChange={handleChange} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Descripción</label>
              <textarea name="descripcion" value={form.descripcion || ""} onChange={handleChange} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Imagen del sorteo</label>
              <input type="file" onChange={handleUpload} />
              {form.imagen && <img src={form.imagen} className={styles.previewImg} alt="preview" />}
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Premios</label>
              {form.premios.map((p, i) => (
                <div key={i} className={styles.premioBox}>
                  <input placeholder="Nombre" value={p.nombre || ""} onChange={(e) => updatePremio(i, "nombre", e.target.value)} />
                  <input placeholder="Descripción" value={p.descripcion || ""} onChange={(e) => updatePremio(i, "descripcion", e.target.value)} />
                  <input type="number" value={p.cantidad || 1} onChange={(e) => updatePremio(i, "cantidad", e.target.value)} />
                  <button className={styles.deleteBtn} onClick={() => deletePremio(i)}>✕</button>
                </div>
              ))}
              <button onClick={addPremio} className={styles.secondaryBtn} style={{ marginTop: 12 }}>+ Agregar premio</button>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.primaryBtn} onClick={handleSave}>Guardar Sorteo</button>
        </div>
      </div>
    </div>
  );
}
