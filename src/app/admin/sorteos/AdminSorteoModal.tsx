"use client";

import { useState } from "react";
import styles from "./sorteos.admin.module.css";

export default function AdminSorteoModal({
  sorteo,
  onClose,
  onSaved,
}: any) {
  const [form, setForm] = useState({
    nombre: sorteo?.nombre || "",
    descripcion: sorteo?.descripcion || "",
    lugar: sorteo?.lugar || "",
    fecha_hora: sorteo?.fecha_hora?.slice(0, 16) || "",
    anio: sorteo?.anio || new Date().getFullYear(),
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardar = async () => {
    const method = sorteo ? "PUT" : "POST";
    const url = sorteo
      ? `/api/administrador/sorteos/${sorteo.id}`
      : "/api/administrador/sorteos";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    onSaved();
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>{sorteo ? "Editar Sorteo" : "Nuevo Sorteo"}</h2>

        <div className={styles.form}>
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} />

          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
          />

          <label>Lugar</label>
          <input name="lugar" value={form.lugar} onChange={handleChange} />

          <label>Fecha y hora</label>
          <input
            type="datetime-local"
            name="fecha_hora"
            value={form.fecha_hora}
            onChange={handleChange}
          />

          <label>Año</label>
          <input
            type="number"
            name="anio"
            value={form.anio}
            onChange={handleChange}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.primaryBtn} onClick={guardar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
