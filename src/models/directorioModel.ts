import prisma from "@/lib/prisma";
import type { Directorio } from "@prisma/client";

export const DirectorioModel = {
  obtenerTodos: async (): Promise<Directorio[]> => {
    return prisma.directorio.findMany({ orderBy: { nombre: "asc" } });
  },

  crear: async (data: {
    nombre: string;
    cargo: string;
    correo: string;
    telefono: string;
    fotoUrl?: string;
    periodoInicio: Date;
    periodoFin?: Date;
  }): Promise<Directorio> => {
    return prisma.directorio.create({ data });
  },

  actualizar: async (id: number, data: Partial<Directorio>): Promise<Directorio> => {
    return prisma.directorio.update({ where: { id }, data });
  },

  eliminar: async (id: number): Promise<Directorio> => {
    return prisma.directorio.delete({ where: { id } });
  },
};
