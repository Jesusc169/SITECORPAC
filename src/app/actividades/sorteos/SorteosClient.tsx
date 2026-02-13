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

  useEffect(() => {
    cargarSorteos();
  }, []);

  useEffect(() => {
    aplicarFiltro();
  }, [anio, todos]);

  /* =========================================
     CARGAR TODOS LOS SORTEOS
  ========================================= */
  async function cargarSorteos() {
    const data = await fetchSorteos(null);

    const ordenados = data.sort(
      (a: Sorteo, b: Sorteo) =>
        new Date(b.fecha_hora).getTime() -
        new Date(a.fecha_hora).getTime()
    );

    setTodos(ordenados);
    setSorteos(ordenados);
  }

  /* =========================================
     FILTRAR POR AÑO + ORDENAR
  ========================================= */
  function aplicarFiltro() {
    let lista = [...todos];

    if (anio) {
      lista = lista.filter((s) => {
        const year = new Date(s.fecha_hora).getFullYear();
        return year === anio;
      });
    }

    lista.sort(
      (a, b) =>
        new Date(b.fecha_hora).getTime() -
        new Date(a.fecha_hora).getTime()
    );

    setSorteos(lista);
  }

  return (
    <SorteosView
      sorteos={sorteos}
      onChangeAnio={setAnio}
    />
  );
}
