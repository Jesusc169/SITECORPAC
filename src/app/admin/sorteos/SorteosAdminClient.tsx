"use client";

import { useEffect, useState } from "react";
import SorteosAdminView from "./SorteosAdminView";

export default function SorteosAdminClient() {
  const [sorteos, setSorteos] = useState([]);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const cargar = async () => {
    const res = await fetch("/api/administrador/sorteos");
    setSorteos(await res.json());
  };

  useEffect(() => {
    cargar();
  }, []);

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
      onEliminar={async (id) => {
        await fetch("/api/administrador/sorteos", {
          method: "DELETE",
          body: JSON.stringify({ id }),
        });
        cargar();
      }}
      onDuplicar={async (id) => {
        await fetch("/api/administrador/sorteos", {
          method: "PATCH",
          body: JSON.stringify({ id }),
        });
        cargar();
      }}
      modal={modal}
      setModal={setModal}
      selected={selected}
      onSave={cargar}
    />
  );
}
