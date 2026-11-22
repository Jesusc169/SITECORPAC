import { errorDe, leerJson } from "@/lib/mensajes";

// ===============================
// GET
// ===============================
// Lanza un Error con texto para la persona si la API falla o no devuelve una
// lista (p. ej. una página HTML de error): así la pantalla no confunde un
// fallo con "no hay sorteos".
export const fetchSorteos = async () => {
  const res = await fetch("/api/administrador/sorteos");
  const datos = await leerJson(res);
  if (!res.ok || !Array.isArray(datos)) {
    throw new Error(errorDe(datos) ?? "No se pudo cargar la lista de sorteos");
  }
  return datos;
};

// ===============================
// ELIMINAR
// ===============================
export const eliminarSorteo = async (id: number) => {
  const res = await fetch(`/api/administrador/sorteos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Error al eliminar sorteo");
  }
};

// ===============================
// DUPLICAR
// ===============================
export const duplicarSorteo = async (id: number) => {
  const res = await fetch(
    `/api/administrador/sorteos/${id}/duplicar`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Error al duplicar sorteo");
  }
  return res.json();
};