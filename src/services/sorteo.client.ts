export const fetchSorteos = async (anio: number | null) => {
  const url = anio ? `/api/sorteos?anio=${anio}` : `/api/sorteos`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
};
