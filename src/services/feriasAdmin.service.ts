const BASE_URL = "/api/administrador/ferias";

export async function getFerias() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error al obtener ferias");
  return res.json();
}

export async function createFeria(data: any) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear feria");
  return res.json();
}

export async function updateFeria(id: number, data: any) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar feria");
  return res.json();
}

export async function deleteFeria(id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar feria");
}

export async function addFecha(feriaId: number, data: any) {
  const res = await fetch(`${BASE_URL}/${feriaId}/fechas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear fecha");
  return res.json();
}

export async function updateEmpresas(
  feriaId: number,
  empresasIds: number[]
) {
  const res = await fetch(`${BASE_URL}/${feriaId}/empresas`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empresasIds }),
  });
  if (!res.ok) throw new Error("Error al asignar empresas");
}
