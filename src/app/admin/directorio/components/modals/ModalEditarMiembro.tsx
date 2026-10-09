"use client";

import React, { useState } from "react";
import styles from "./ModalMiembro.module.css";

interface Miembro {
  id: number;
  nombre: string;
  cargo: string;
  correo: string;
  telefono: string;
  periodoInicio: string;
  periodoFin?: string | null;
}

interface ModalEditarProps {
  miembro: Miembro;
  onClose: () => void;
  onSubmit: (id: number, formData: FormData) => Promise<void>;
}

export default function ModalEditarMiembro({ miembro, onClose, onSubmit }: Readonly<ModalEditarProps>) {
  const [nombre, setNombre] = useState(miembro.nombre);
  const [cargo, setCargo] = useState(miembro.cargo);
  const [correo, setCorreo] = useState(miembro.correo);
  const [telefono, setTelefono] = useState(miembro.telefono);
  const [periodoInicio, setPeriodoInicio] = useState(miembro.periodoInicio.slice(0, 10));
  const [periodoFin, setPeriodoFin] = useState(miembro.periodoFin?.slice(0, 10) ?? "");
  const [foto, setFoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("cargo", cargo);
    formData.append("correo", correo);
    formData.append("telefono", telefono);
    formData.append("periodoInicio", periodoInicio);
    if (periodoFin) formData.append("periodoFin", periodoFin);
    if (foto) formData.append("foto", foto);

    await onSubmit(miembro.id, formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Editar Miembro</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="editar-miembro-nombre">Nombre</label>
          <input id="editar-miembro-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />

          <label htmlFor="editar-miembro-cargo">Cargo</label>
          <input id="editar-miembro-cargo" value={cargo} onChange={e => setCargo(e.target.value)} required />

          <label htmlFor="editar-miembro-correo">Correo</label>
          <input id="editar-miembro-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />

          <label htmlFor="editar-miembro-telefono">Teléfono</label>
          <input id="editar-miembro-telefono" value={telefono} onChange={e => setTelefono(e.target.value)} required />

          <label htmlFor="editar-miembro-periodo-inicio">Periodo Inicio</label>
          <input id="editar-miembro-periodo-inicio" type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} required />

          <label htmlFor="editar-miembro-periodo-fin">Periodo Fin</label>
          <input id="editar-miembro-periodo-fin" type="date" value={periodoFin} onChange={e => setPeriodoFin(e.target.value)} />

          <label htmlFor="editar-miembro-foto">Foto (opcional)</label>
          <input id="editar-miembro-foto" type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} />

          <div className={styles.buttons}>
            <button type="submit" className={styles.primary}>Guardar</button>
            <button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
