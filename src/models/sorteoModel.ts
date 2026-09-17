import prisma from "@/lib/prisma";

const CON_IMAGENES = {
  sorteo_producto: true,
  sorteo_imagen: { orderBy: { orden: "asc" as const } },
};

export const SorteoModel = {
  obtenerActivos: async (anio: number | null) => {
    return prisma.sorteo.findMany({
      where: {
        estado: "ACTIVO",
        ...(anio ? { anio } : {}),
      },
      include: CON_IMAGENES,
      orderBy: { fecha_hora: "desc" },
    });
  },

  obtenerTodos: async () => {
    return prisma.sorteo.findMany({
      orderBy: { fecha_hora: "desc" },
      include: CON_IMAGENES,
    });
  },

  obtenerPorId: async (id: number) => {
    return prisma.sorteo.findUnique({
      where: { id },
      include: CON_IMAGENES,
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
    imagenes?: { url: string; orden: number; principal: boolean }[];
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
        sorteo_imagen: { create: data.imagenes ?? [] },
      },
      include: CON_IMAGENES,
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
      imagen?: string | null;
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
      include: CON_IMAGENES,
    });
  },

  eliminar: async (id: number) => {
    return prisma.sorteo.delete({ where: { id } });
  },

  contarActivos: async () => {
    return prisma.sorteo.count({ where: { estado: "ACTIVO" } });
  },

  crearImagen: async (data: { sorteo_id: number; url: string; orden: number; principal: boolean }) => {
    return prisma.sorteo_imagen.create({ data });
  },

  eliminarImagenes: async (ids: number[]) => {
    if (ids.length === 0) return;
    await prisma.sorteo_imagen.deleteMany({ where: { id: { in: ids } } });
  },

  reordenarImagen: async (id: number, orden: number) => {
    await prisma.sorteo_imagen.update({ where: { id }, data: { orden } });
  },

  marcarImagenPrincipal: async (sorteo_id: number, id: number) => {
    await prisma.sorteo_imagen.updateMany({
      where: { sorteo_id },
      data: { principal: false },
    });
    await prisma.sorteo_imagen.update({ where: { id }, data: { principal: true } });
  },
};
