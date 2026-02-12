// ===============================
// GET
// ===============================
export const fetchSorteos = async () => {
  const res = await fetch("/api/administrador/sorteos");
  return res.json();
};

// ===============================
// CREAR
// ===============================
export const crearSorteo = async (data: any) => {
  const res = await fetch("/api/administrador/sorteos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

// ===============================
// EDITAR
// ===============================
export const actualizarSorteo = async (data: any) => {
  const res = await fetch(`/api/administrador/sorteos/${data.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

// ===============================
// ELIMINAR
// ===============================
export const eliminarSorteo = async (id: number) => {
  await fetch(`/api/administrador/sorteos/${id}`, {
    method: "DELETE",
  });
};

// ===============================
// DUPLICAR
// ===============================
export const duplicarSorteo = async (id: number) => {
  const res = await fetch(`/api/administrador/sorteos/${id}/duplicar`, {
    method: "POST",
  });

  return res.json();
};
