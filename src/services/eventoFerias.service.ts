export async function fetchFerias(anio?: number) {
  const url = anio
    ? `/api/evento-ferias?anio=${anio}`
    : `/api/evento-ferias`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener ferias");
  }

  return res.json();
}
