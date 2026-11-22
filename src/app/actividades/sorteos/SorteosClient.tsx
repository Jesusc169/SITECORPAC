"use client";

import { useEffect, useMemo, useState } from "react";
import SorteosView, { type Sorteo, type NoticiaMini } from "./SorteosView";
import { fetchSorteos } from "@/services/sorteo.client";

function tiempo(s: Sorteo) {
  const t = new Date(s.fecha_hora).getTime();
  return isNaN(t) ? 0 : t;
}

function anioDe(s: Sorteo) {
  const fecha = new Date(s.fecha_hora);
  return isNaN(fecha.getTime()) ? null : fecha.getFullYear();
}

export default function SorteosClient({ noticia }: Readonly<{ noticia?: NoticiaMini | null }>) {
  // Por defecto se ven los sorteos del año en curso (propuesta A+C);
  // "Ver todos" quita el filtro.
  const [anio, setAnio] = useState<number | null>(() => new Date().getFullYear());
  const [todos, setTodos] = useState<Sorteo[]>([]);
  const [cargando, setCargando] = useState(true);
  // Momento en que llegaron los sorteos: con él se marcan los ya realizados.
  // Se toma una sola vez al recibir los datos (no en cada render), así el
  // resultado es estable y no difiere entre servidor y navegador.
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    fetchSorteos(null)
      .then((data) => {
        setAhora(Date.now());
        setTodos(Array.isArray(data) ? [...data].sort((a, b) => tiempo(b) - tiempo(a)) : []);
      })
      .catch((error) => {
        console.error("Error cargando sorteos:", error);
        setTodos([]);
      })
      .finally(() => setCargando(false));
  }, []);

  const aniosDisponibles = useMemo(() => {
    const anios = new Set<number>([new Date().getFullYear()]);
    for (const s of todos) {
      const a = anioDe(s);
      if (a !== null) anios.add(a);
    }
    return Array.from(anios).sort((a, b) => b - a);
  }, [todos]);

  const sorteos = anio === null ? todos : todos.filter((s) => anioDe(s) === anio);

  return (
    <SorteosView
      sorteos={sorteos}
      hayAnteriores={todos.length > 0}
      cargando={cargando}
      ahora={ahora}
      onChangeAnio={setAnio}
      aniosDisponibles={aniosDisponibles}
      anioSeleccionado={anio}
      noticia={noticia ?? null}
    />
  );
}
