"use client";
import React, { useState } from "react";
import styles from "../AdministradorNoticias.module.css";

export default function ModalEditarNoticia({ noticia, onClose, onSubmit }) {
  const [form, setForm] = useState({
    titulo: noticia.titulo,
    descripcion: noticia.descripcion,
    imagen: noticia.imagen || "",
    fecha: noticia.fecha.split("T")[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Editar Noticia</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />
          <div className={styles.modalButtons}>
            <button type="submit" className={styles.btnGuardar}>
              Actualizar
            </button>
            <button
              type="button"
              className={styles.btnCancelar}
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
