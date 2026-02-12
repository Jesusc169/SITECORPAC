"use client";

import { useEffect, useState } from "react";
import SorteosAdminView, { Sorteo } from "./SorteosAdminView";
import AdminSorteoModal from "./AdminSorteoModal";
import {
  fetchSorteos,
  crearSorteo,
  actualizarSorteo,
  duplicarSorteo,
  eliminarSorteo,
} from "@/services/sorteo.service";

/* =========================================
MAP BACKEND → FRONTEND
========================================= */
const mapSorteoToFrontend = (s: any): Sorteo => ({
  id: s.id,
  nombre: s.nombre ?? "",
  descripcion: s.descripcion ?? "",
  lugar: s.lugar ?? "Sede principal SITECORPAC",
  imagen: s.imagen ?? "", // 🔥 ahora sí existe en interface Sorteo
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
  CARGAR SORTEOS
  ========================================= */
  const cargar = async () => {
    try {
      const data = await fetchSorteos();
      const mapped = (data || []).map(mapSorteoToFrontend);
      setSorteos(mapped);
    } catch (err) {
      console.error("Error cargando sorteos:", err);
      alert("Error cargando sorteos");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  /* =========================================
  GUARDAR (crear o editar)
  ========================================= */
  const onSave = async (data: any) => {
    if (loadingSave) return;
    setLoadingSave(true);

    try {
      let backend;

      if (data.id) {
        // ✏️ EDITAR
        backend = await actualizarSorteo(data);
        const actualizado = mapSorteoToFrontend(backend);

        setSorteos((prev) =>
          prev.map((s) => (s.id === actualizado.id ? actualizado : s))
        );
      } else {
        // 🆕 CREAR
        backend = await crearSorteo(data);
        const nuevo = mapSorteoToFrontend(backend);

        setSorteos((prev) => [nuevo, ...prev]);
      }

      setSelected(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Error guardando sorteo:", err);
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

    try {
      await eliminarSorteo(id);
      setSorteos((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error eliminando sorteo");
    }
  };

  /* =========================================
  DUPLICAR
  ========================================= */
  const onDuplicar = async (id: number) => {
    try {
      const backend = await duplicarSorteo(id);
      const nuevo = mapSorteoToFrontend(backend);

      setSorteos((prev) => [nuevo, ...prev]);
    } catch (err) {
      console.error("Error duplicando:", err);
      alert("Error duplicando sorteo");
    }
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
