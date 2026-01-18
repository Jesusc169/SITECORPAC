"use client";

import { useEffect, useState } from "react";
import {
  getFerias,
  createFeria,
  deleteFeria,
} from "@/services/feriasAdmin.service";

export function useFeriasAdmin() {
  const [ferias, setFerias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFerias() {
    setLoading(true);
    const data = await getFerias();
    setFerias(data);
    setLoading(false);
  }

  async function crearFeria(data: any) {
    await createFeria(data);
    await loadFerias();
  }

  async function eliminarFeria(id: number) {
    if (!confirm("¿Eliminar esta feria?")) return;
    await deleteFeria(id);
    await loadFerias();
  }

  useEffect(() => {
    loadFerias();
  }, []);

  return {
    ferias,
    loading,
    crearFeria,
    eliminarFeria,
  };
}
