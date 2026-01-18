export const fetchSorteos = async (anio: number | null) => {
  const url = anio
    ? `/api/administrador/sorteos?anio=${anio}`
    : `/api/administrador/sorteos`;

  const res = await fetch(url);
  return res.json();
};
