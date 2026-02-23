"use client";

import { useEffect, useState } from "react";
import SorteosAdminView, { Sorteo } from "./SorteosAdminView";
import AdminSorteoModal from "./AdminSorteoModal";
import {
  fetchSorteos,
  eliminarSorteo,
  duplicarSorteo,
} from "@/services/sorteo.service";

/* =========================================
MAP BACKEND → FRONTEND
========================================= */
const mapSorteoToFrontend = (s: any): Sorteo => ({
  id: s.id,
  nombre: s.nombre ?? "",
  descripcion: s.descripcion ?? "",
  lugar: s.lugar ?? "Sede principal SITECORPAC",
  imagen: s.imagen ?? "",
  anio: s.anio ?? new Date().getFullYear(),
  estado: s.estado ?? "ACTIVO",
  fecha_hora: s.fecha_hora
    ? new Date(s.fecha_hora).toISOString()
    : new Date().toISOString(),
  premios:
    s.sorteo_producto?.map((p: any) => ({
      id: p.id,
      nombre: p.nombre ?? "",
      descripcion: p.descripcion ?? "",
      sorteo_id: p.sorteo_id,
      cantidad: p.cantidad ?? 1,
    })) ?? [],
});

/* =========================================
COMPONENT
========================================= */
export default function SorteosAdminClient() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Sorteo | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  /* =========================================
  CARGAR
  ========================================= */
  const cargar = async () => {
    const data = await fetchSorteos();
    const mapped = (data || []).map(mapSorteoToFrontend);
    setSorteos(mapped);
  };

  useEffect(() => {
    cargar();
  }, []);

  /* =========================================
  GUARDAR (🔥 CORREGIDO)
  ========================================= */
  const onSave = async (id: number | null, formData: FormData) => {
    if (loadingSave) return;
    setLoadingSave(true);

    try {
      const isEdit = !!id;

      const url = isEdit
        ? `/api/administrador/sorteos/${id}`
        : `/api/administrador/sorteos`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error("Error guardando");

      const backend = await res.json();
      const mapped = mapSorteoToFrontend(backend);

      if (isEdit) {
        setSorteos((prev) =>
          prev.map((s) => (s.id === mapped.id ? mapped : s))
        );
      } else {
        setSorteos((prev) => [mapped, ...prev]);
      }

      setSelected(null);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error guardando sorteo");
    } finally {
      setLoadingSave(false);
    }
  };

  /* =========================================
  ELIMINAR
  ========================================= */
  const onEliminar = async (id: number) => {
    if (!confirm("¿Eliminar sorteo?")) return;

    await eliminarSorteo(id);
    setSorteos((prev) => prev.filter((s) => s.id !== id));
  };

  /* =========================================
  DUPLICAR
  ========================================= */
  const onDuplicar = async (id: number) => {
    const backend = await duplicarSorteo(id);
    const nuevo = mapSorteoToFrontend(backend);
    setSorteos((prev) => [nuevo, ...prev]);
  };

  /* =========================================
  UI
  ========================================= */
  return (
    <>
      <SorteosAdminView
        sorteos={sorteos}
        onNuevo={() => {
          setSelected(null);
          setModalOpen(true);
        }}
        onEditar={(s) => {
          setSelected(s);
          setModalOpen(true);
        }}
        onEliminar={onEliminar}
        onDuplicar={onDuplicar}
        modal={modalOpen}
        setModal={setModalOpen}
        selected={selected}
        onSave={onSave}
      />

      <AdminSorteoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
        initialData={selected}
      />
    </>
  );
}