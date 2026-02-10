// src/services/eventoFerias.service.ts
import { EventoFeria } from "@/views/FeriasView";

export async function fetchFerias(
  anio?: number
): Promise<EventoFeria[]> {

  let url = "/api/ferias";

  if (anio) {
    url += `?anio=${anio}`;
  }

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener ferias");
  }

  return res.json();
}
