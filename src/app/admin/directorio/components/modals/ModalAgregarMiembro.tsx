"use client";

import React, { useState } from "react";
import styles from "./ModalMiembro.module.css";
import imageCompression from "browser-image-compression";

interface ModalAgregarProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ModalAgregarMiembro({ onClose, onSubmit }: Readonly<ModalAgregarProps>) {
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

      setFoto(compressed);
    } catch {
      setFoto(file);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
          <label htmlFor="agregar-miembro-nombre">Nombre</label>
          <input id="agregar-miembro-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />

          <label htmlFor="agregar-miembro-cargo">Cargo</label>
          <input id="agregar-miembro-cargo" value={cargo} onChange={e => setCargo(e.target.value)} required />

          <label htmlFor="agregar-miembro-correo">Correo</label>
          <input id="agregar-miembro-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />

          <label htmlFor="agregar-miembro-telefono">Teléfono</label>
          <input id="agregar-miembro-telefono" value={telefono} onChange={e => setTelefono(e.target.value)} required />

          <label htmlFor="agregar-miembro-periodo-inicio">Periodo Inicio</label>
          <input id="agregar-miembro-periodo-inicio" type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} required />

          <label htmlFor="agregar-miembro-periodo-fin">Periodo Fin</label>
          <input id="agregar-miembro-periodo-fin" type="date" value={periodoFin} onChange={e => setPeriodoFin(e.target.value)} />

          <label htmlFor="agregar-miembro-foto">Foto (opcional)</label>
          <input id="agregar-miembro-foto" type="file" accept="image/*" onChange={handleFileChange} />

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
