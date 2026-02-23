"use client";

import { useEffect, useState } from "react";
import SorteosView from "./SorteosView";
import { fetchSorteos } from "@/services/sorteo.client";

interface SorteoProducto {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  cantidad?: number | null;
}

interface Sorteo {
  id: number;
  nombre: string;
  descripcion: string;
  imagen?: string | null;
  lugar: string;
  fecha_hora: string;
  anio: number;
  sorteo_producto?: SorteoProducto[];
  premios?: SorteoProducto[];
}

export default function SorteosClient() {
  const [anio, setAnio] = useState<number | null>(null);
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [todos, setTodos] = useState<Sorteo[]>([]);

  /* =========================================
     CARGAR TODOS LOS SORTEOS
  ========================================= */
  useEffect(() => {
    cargarSorteos();
  }, []);

  async function cargarSorteos() {
    try {
      const data = await fetchSorteos(null);

      if (!Array.isArray(data)) {
        setTodos([]);
        setSorteos([]);
        return;
      }

      const ordenados = [...data].sort((a: Sorteo, b: Sorteo) => {
        const fechaA = new Date(a.fecha_hora);
        const fechaB = new Date(b.fecha_hora);

        const timeA = isNaN(fechaA.getTime()) ? 0 : fechaA.getTime();
        const timeB = isNaN(fechaB.getTime()) ? 0 : fechaB.getTime();

        return timeB - timeA;
      });

      setTodos(ordenados);
      setSorteos(ordenados);
    } catch (error) {
      console.error("Error cargando sorteos:", error);
      setTodos([]);
      setSorteos([]);
    }
  }

  /* =========================================
     FILTRAR POR AÑO + ORDENAR
  ========================================= */
  useEffect(() => {
    aplicarFiltro();
  }, [anio, todos]);

  function aplicarFiltro() {
    let lista = [...todos];

    if (anio) {
      lista = lista.filter((s) => {
        const fecha = new Date(s.fecha_hora);
        if (isNaN(fecha.getTime())) return false;
        return fecha.getFullYear() === anio;
      });
    }

    lista.sort((a, b) => {
      const fechaA = new Date(a.fecha_hora);
      const fechaB = new Date(b.fecha_hora);

      const timeA = isNaN(fechaA.getTime()) ? 0 : fechaA.getTime();
      const timeB = isNaN(fechaB.getTime()) ? 0 : fechaB.getTime();

      return timeB - timeA;
    });

    setSorteos(lista);
  }

  return (
    <SorteosView
      sorteos={sorteos}
      onChangeAnio={setAnio}
    />
  );
}