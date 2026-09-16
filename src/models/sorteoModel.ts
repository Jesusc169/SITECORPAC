import prisma from "@/lib/prisma";

export const SorteoModel = {
  obtenerActivos: async (anio: number | null) => {
    return prisma.sorteo.findMany({
      where: {
        estado: "ACTIVO",
        ...(anio ? { anio } : {}),
      },
      include: { sorteo_producto: true },
      orderBy: { fecha_hora: "desc" },
    });
  },

  obtenerTodos: async () => {
    return prisma.sorteo.findMany({
      orderBy: { fecha_hora: "desc" },
      include: { sorteo_producto: true },
    });
  },

  obtenerPorId: async (id: number) => {
    return prisma.sorteo.findUnique({
      where: { id },
      include: { sorteo_producto: true },
    });
  },

  crear: async (data: {
    nombre: string;
    descripcion: string;
    lugar: string;
    anio: number;
    estado: "ACTIVO" | "INACTIVO";
    fecha_hora: Date;
    imagen: string | null;
    premios: { nombre: string; descripcion: string; cantidad: number }[];
  }) => {
    return prisma.sorteo.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        lugar: data.lugar,
        anio: data.anio,
        estado: data.estado,
        fecha_hora: data.fecha_hora,
        imagen: data.imagen,
        sorteo_producto: { create: data.premios },
      },
      include: { sorteo_producto: true },
    });
  },

  actualizar: async (
    id: number,
    data: {
      nombre: string;
      descripcion: string;
      lugar: string;
      anio: number;
      estado: "ACTIVO" | "INACTIVO";
      fecha_hora: Date;
      imagen?: string;
      premios: { nombre: string; descripcion: string; cantidad: number }[];
    }
  ) => {
    const { premios, ...resto } = data;
    return prisma.sorteo.update({
      where: { id },
      data: {
        ...resto,
        sorteo_producto: {
          deleteMany: {},
          create: premios,
        },
      },
      include: { sorteo_producto: true },
    });
  },

  eliminar: async (id: number) => {
    return prisma.sorteo.delete({ where: { id } });
  },

  contarActivos: async () => {
    return prisma.sorteo.count({ where: { estado: "ACTIVO" } });
  },
};
