"use client";

import { useEffect, useState } from "react";
import SorteosAdminView, { Sorteo } from "./SorteosAdminView";

export default function SorteosAdminClient() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Sorteo | null>(null);

  const cargar = async () => {
    const res = await fetch("/api/administrador/sorteos");
    const data = await res.json();
    setSorteos(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const onEliminar = async (id: number) => {
    await fetch(`/api/administrador/sorteos/${id}`, {
      method: "DELETE",
    });
    await cargar();
  };

  const onDuplicar = async (id: number) => {
    await fetch(`/api/administrador/sorteos/${id}/duplicar`, {
      method: "POST",
    });
    await cargar();
  };

  return (
    <SorteosAdminView
      sorteos={sorteos}
      onNuevo={() => {
        setSelected(null);
        setModal(true);
      }}
      onEditar={(s) => {
        setSelected(s);
        setModal(true);
      }}
      onEliminar={onEliminar}
      onDuplicar={onDuplicar}
      modal={modal}
      setModal={setModal}
      selected={selected}
      onSave={cargar}
    />
  );
}
