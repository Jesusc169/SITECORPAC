// ===============================
// HELPER: convertir a FormData
// ===============================
const buildFormData = (data: any) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value === null || value === undefined) return;

    // Si es array u objeto → stringify
    if (typeof value === "object" && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });

  return formData;
};

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
  const hasFile = data.imagen instanceof File;

  const res = await fetch("/api/administrador/sorteos", {
    method: "POST",
    body: hasFile ? buildFormData(data) : JSON.stringify(data),
    headers: hasFile
      ? undefined
      : { "Content-Type": "application/json" },
  });

  return res.json();
};

// ===============================
// EDITAR
// ===============================
export const actualizarSorteo = async (data: any) => {
  const hasFile = data.imagen instanceof File;

  const res = await fetch(`/api/administrador/sorteos/${data.id}`, {
    method: "PUT",
    body: hasFile ? buildFormData(data) : JSON.stringify(data),
    headers: hasFile
      ? undefined
      : { "Content-Type": "application/json" },
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
  const res = await fetch(
    `/api/administrador/sorteos/${id}/duplicar`,
    {
      method: "POST",
    }
  );

  return res.json();
};