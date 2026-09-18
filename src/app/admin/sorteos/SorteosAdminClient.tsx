"use client";

import { useEffect, useState } from "react";
import SorteosAdminView, { Sorteo } from "./SorteosAdminView";
import AdminSorteoModal from "./AdminSorteoModal";
import {
  fetchSorteos,
  eliminarSorteo,
  duplicarSorteo,
} from "@/services/sorteo.service";
import Toast from "@/components/Toast/Toast";
import { useToast } from "@/components/Toast/useToast";

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
  sorteo_imagen: s.sorteo_imagen ?? [],
});

/* =========================================
COMPONENT
========================================= */
export default function SorteosAdminClient() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Sorteo | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();

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

      if (!res.ok) {
        // La API devuelve el motivo real en { error } (ej. "Cada imagen
        // debe ser menor a 10MB"), no solo un genérico "Error guardando".
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Error guardando sorteo");
      }

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
      mostrarToast("exito", isEdit ? "Sorteo actualizado correctamente" : "Sorteo publicado correctamente");
    } catch (err) {
      console.error(err);
      mostrarToast("error", err instanceof Error ? err.message : "Error guardando sorteo");
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
      mostrarToast("exito", "Sorteo eliminado correctamente");
    } catch (err) {
      console.error(err);
      mostrarToast("error", err instanceof Error ? err.message : "No se pudo eliminar el sorteo");
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
      mostrarToast("exito", "Sorteo duplicado correctamente");
    } catch (err) {
      console.error(err);
      mostrarToast("error", err instanceof Error ? err.message : "No se pudo duplicar el sorteo");
    }
  };

  /* =========================================
  UI
  ========================================= */
  return (
    <>
      <Toast toast={toast} onClose={cerrarToast} />

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