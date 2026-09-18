export const fetchFerias = async () => {
  const res = await fetch("/api/administrador/ferias", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar ferias");
  return res.json();
};

export const fetchEmpresasDisponibles = async () => {
  const res = await fetch("/api/administrador/empresas", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar empresas");
  return res.json();
};

export const fetchFeriaPorId = async (id: number) => {
  const res = await fetch(`/api/administrador/ferias/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener feria");
  return res.json();
};

export const guardarFeria = async (isEdit: boolean, id: number | undefined, formData: FormData) => {
  const res = await fetch(
    isEdit ? `/api/administrador/ferias/${id}` : "/api/administrador/ferias",
    {
      method: isEdit ? "PUT" : "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    // La API devuelve el motivo real en { error } (ej. "Cada imagen debe
    // ser menor a 10MB"); sin esto la secretaria solo veía un mensaje
    // genérico sin saber qué corregir.
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Error al guardar feria");
  }
  return res.json();
};

export const duplicarFeria = async (id: number) => {
  const res = await fetch(`/api/administrador/ferias/${id}/duplicar`, {
    method: "POST",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text;
};

export const eliminarFeria = async (id: number) => {
  const res = await fetch(`/api/administrador/ferias/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Error al eliminar feria");
  }
};
