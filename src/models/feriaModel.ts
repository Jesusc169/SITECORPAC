import prisma from "@/lib/prisma";

const CON_RELACIONES = {
  evento_feria_fecha: true,
  evento_feria_empresa: {
    include: { empresa: true },
  },
};

export const FeriaModel = {
  obtenerTodas: async () => {
    return prisma.evento_feria.findMany({
      orderBy: { created_at: "desc" },
      include: CON_RELACIONES,
    });
  },

  obtenerPublicas: async (opciones: { anio: number | null; skip: number; take: number }) => {
    return prisma.evento_feria.findMany({
      where: {
        estado: true,
        ...(opciones.anio ? { anio: opciones.anio } : {}),
      },
      orderBy: { created_at: "desc" },
      skip: opciones.skip,
      take: opciones.take,
      include: CON_RELACIONES,
    });
  },

  obtenerPorId: async (id: number) => {
    return prisma.evento_feria.findUnique({
      where: { id },
      include: CON_RELACIONES,
    });
  },

  crear: async (data: {
    titulo: string;
    descripcion: string;
    anio: number;
    imagen_portada: string | null;
    fechas: { fecha: Date; hora_inicio: string; hora_fin: string; ubicacion: string; zona: string | null }[];
    empresas: number[];
  }) => {
    return prisma.evento_feria.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        anio: data.anio,
        imagen_portada: data.imagen_portada,
        evento_feria_fecha: { create: data.fechas },
        evento_feria_empresa: { create: data.empresas.map((empresa_id) => ({ empresa_id })) },
      },
      include: CON_RELACIONES,
    });
  },

  actualizar: async (
    id: number,
    data: { titulo: string; descripcion: string; imagen_portada?: string }
  ) => {
    return prisma.evento_feria.update({
      where: { id },
      data,
    });
  },

  reemplazarEmpresas: async (feriaId: number, empresaIds: number[]) => {
    await prisma.evento_feria_empresa.deleteMany({ where: { feria_id: feriaId } });
    if (empresaIds.length > 0) {
      await prisma.evento_feria_empresa.createMany({
        data: empresaIds.map((empresa_id) => ({ feria_id: feriaId, empresa_id })),
      });
    }
  },

  reemplazarFechas: async (
    feriaId: number,
    fechas: { fecha: Date; hora_inicio: string; hora_fin: string; ubicacion: string; zona: string | null }[]
  ) => {
    await prisma.evento_feria_fecha.deleteMany({ where: { feria_id: feriaId } });
    if (fechas.length > 0) {
      await prisma.evento_feria_fecha.createMany({
        data: fechas.map((f) => ({ feria_id: feriaId, ...f })),
      });
    }
  },

  crearEmpresas: async (feriaId: number, empresaIds: number[]) => {
    if (empresaIds.length === 0) return;
    await prisma.evento_feria_empresa.createMany({
      data: empresaIds.map((empresa_id) => ({ feria_id: feriaId, empresa_id })),
    });
  },

  crearFechas: async (
    feriaId: number,
    fechas: { fecha: Date; hora_inicio: string; hora_fin: string; ubicacion: string; zona: string | null }[]
  ) => {
    if (fechas.length === 0) return;
    await prisma.evento_feria_fecha.createMany({
      data: fechas.map((f) => ({ feria_id: feriaId, ...f })),
    });
  },

  eliminarRelaciones: async (feriaId: number) => {
    await prisma.evento_feria_empresa.deleteMany({ where: { feria_id: feriaId } });
    await prisma.evento_feria_fecha.deleteMany({ where: { feria_id: feriaId } });
  },

  eliminar: async (id: number) => {
    return prisma.evento_feria.delete({ where: { id } });
  },
};
