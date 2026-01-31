"use client";

import React, { useState } from "react";
import styles from "@/app/admin/directorio/AdministradorDirectorio.module.css";

interface ModalAgregarProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function ModalAgregarMiembro({ onClose, onSubmit }: ModalAgregarProps) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("cargo", cargo);
    formData.append("correo", correo);
    formData.append("telefono", telefono);
    if (foto) formData.append("foto", foto);

    await onSubmit(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Agregar Miembro</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Cargo"
            value={cargo}
            onChange={e => setCargo(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            required
          />
          <input
            type="file"
            onChange={e => setFoto(e.target.files ? e.target.files[0] : null)}
          />
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
