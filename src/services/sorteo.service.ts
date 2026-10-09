// ===============================
// GET
// ===============================
export const fetchSorteos = async () => {
  const res = await fetch("/api/administrador/sorteos");
  return res.json();
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