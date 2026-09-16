import prisma from "@/lib/prisma";
import type { directorio } from "@prisma/client";

export const DirectorioModel = {
  obtenerTodos: async (): Promise<directorio[]> => {
    return prisma.directorio.findMany({
      orderBy: { orden: "asc" },
    });
  },

  obtenerPorId: async (id: number): Promise<directorio | null> => {
    return prisma.directorio.findUnique({ where: { id } });
  },

  obtenerUltimoOrden: async (): Promise<number> => {
    const ultimo = await prisma.directorio.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });
    return ultimo?.orden ?? 0;
  },

  crear: async (data: {
    nombre: string;
    cargo: string;
    correo: string;
    telefono: string;
    fotoUrl?: string | null;
    periodoInicio: Date;
    periodoFin?: Date | null;
    orden: number;
  }): Promise<directorio> => {
    return prisma.directorio.create({ data });
  },

  actualizar: async (
    id: number,
    data: Partial<directorio>
  ): Promise<directorio> => {
    return prisma.directorio.update({
      where: { id },
      data,
    });
  },

  eliminar: async (id: number): Promise<directorio> => {
    return prisma.directorio.delete({
      where: { id },
    });
  },
};
