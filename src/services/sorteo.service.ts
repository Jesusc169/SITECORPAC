import { prisma } from "@/lib/prisma";

export const obtenerSorteos = () =>
  prisma.sorteo.findMany({
    include: { sorteo_producto: true },
    orderBy: { fecha_hora: "desc" },
  });

export const crearSorteo = (data: any) =>
  prisma.sorteo.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      lugar: data.lugar,
      fecha_hora: new Date(data.fecha_hora),
      anio: data.anio,
      imagen: data.imagen,
    },
  });

export const actualizarSorteo = (data: any) =>
  prisma.sorteo.update({
    where: { id: data.id },
    data,
  });

export const eliminarSorteo = (id: number) =>
  prisma.sorteo.delete({ where: { id } });

export const duplicarSorteo = async (id: number) => {
  const sorteo = await prisma.sorteo.findUnique({
    where: { id },
    include: { sorteo_producto: true },
  });

  if (!sorteo) return null;

  return prisma.sorteo.create({
    data: {
      nombre: `${sorteo.nombre} (Copia)`,
      descripcion: sorteo.descripcion,
      lugar: sorteo.lugar,
      fecha_hora: sorteo.fecha_hora,
      anio: sorteo.anio,
      imagen: sorteo.imagen,
      sorteo_producto: {
        create: sorteo.sorteo_producto.map((p) => ({
          nombre: p.nombre,
          descripcion: p.descripcion,
          cantidad: p.cantidad,
        })),
      },
    },
  });
};
