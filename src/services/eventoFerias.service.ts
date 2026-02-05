// src/services/eventoFerias.service.ts

import { EventoFeria } from "@/views/FeriasView";

export async function fetchFerias(
  anio?: number
): Promise<EventoFeria[]> {
  const query = anio ? `?anio=${anio}` : "";

  const res = await fetch(`/api/administrador/ferias${query}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener ferias");
  }

  return res.json();
}
