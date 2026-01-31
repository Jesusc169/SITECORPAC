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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("cargo", cargo);
      formData.append("correo", correo);
      formData.append("telefono", telefono);
      if (foto) formData.append("foto", foto);

      await onSubmit(formData); // ⚡ mantiene tu lógica
      onClose(); // cerrar modal al finalizar
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al agregar el miembro");
    } finally {
      setLoading(false);
    }
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

          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
