import React, { useState } from "react";
import styles from "../AdministradorNoticias.module.css";

export default function ModalAgregarNoticia({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    imagen: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Nueva Noticia</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="titulo"
            placeholder="Título"
            value={form.titulo}
            onChange={handleChange}
            required
          />
          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            required
          ></textarea>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="imagen"
            placeholder="URL de imagen (opcional)"
            value={form.imagen}
            onChange={handleChange}
          />
          <div className={styles.modalButtons}>
            <button type="submit" className={styles.btnGuardar}>
              Guardar
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
