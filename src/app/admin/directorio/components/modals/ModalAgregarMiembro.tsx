"use client";

import React, { useState } from "react";
import styles from "./ModalMiembro.module.css";

interface ModalAgregarProps {
  onClose: () => void;
  onSubmit?: (formData: FormData) => Promise<void>; // ⚡ agregado para tipado
}

export default function ModalAgregar({ onClose, onSubmit }: ModalAgregarProps) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("cargo", cargo);
    formData.append("correo", correo);
    formData.append("telefono", telefono);
    formData.append("periodoInicio", periodoInicio);
    if (periodoFin) formData.append("periodoFin", periodoFin);
    if (foto) formData.append("foto", foto);

    try {
      if (onSubmit) {
        // ⚡ si la página pasa onSubmit, usamos esa función
        await onSubmit(formData);
      } else {
        // ⚡ fallback: POST directo al API
        const res = await fetch("/api/administrador/directorio", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Error al agregar miembro");
        const data = await res.json();
        console.log("Miembro agregado:", data);
      }

      onClose(); // cerrar modal
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Agregar Miembro</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required />

          <label>Cargo</label>
          <input value={cargo} onChange={e => setCargo(e.target.value)} required />

          <label>Correo</label>
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />

          <label>Teléfono</label>
          <input value={telefono} onChange={e => setTelefono(e.target.value)} required />

          <label>Periodo Inicio</label>
          <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} required />

          <label>Periodo Fin</label>
          <input type="date" value={periodoFin} onChange={e => setPeriodoFin(e.target.value)} />

          <label>Foto (opcional)</label>
          <input type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className={styles.buttons}>
            <button type="submit" className={styles.primary} disabled={loading}>
              {loading ? "Agregando..." : "Agregar"}
            </button>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
