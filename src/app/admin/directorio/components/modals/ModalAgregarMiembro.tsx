"use client";

import React, { useState } from "react";
import styles from "./ModalMiembro.module.css";
import imageCompression from "browser-image-compression";

interface ModalAgregarProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ModalAgregarMiembro({ onClose, onSubmit }: ModalAgregarProps) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      setFoto(compressed as File);
    } catch {
      setFoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("cargo", cargo);
    formData.append("correo", correo);
    formData.append("telefono", telefono);
    formData.append("periodoInicio", periodoInicio);
    if (periodoFin) formData.append("periodoFin", periodoFin);
    if (foto) formData.append("foto", foto);

    await onSubmit(formData);
    setLoading(false);
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
          <input type="file" accept="image/*" onChange={handleFileChange} />

          <div className={styles.buttons}>
            <button type="submit" className={styles.primary} disabled={loading}>
              {loading ? "Guardando..." : "Agregar"}
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
