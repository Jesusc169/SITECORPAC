import prisma from "@/lib/prisma";
import type { directorio } from "@prisma/client";

export const DirectorioModel = {
  obtenerTodos: async (): Promise<directorio[]> => {
    return prisma.directorio.findMany({
      orderBy: { nombre: "asc" },
    });
  },

  crear: async (data: {
    nombre: string;
    cargo: string;
    correo: string;
    telefono: string;
    fotoUrl?: string;
    periodoInicio: Date;
    periodoFin?: Date;
  }): Promise<directorio> => {
    return prisma.directorio.create({
      data: {
        ...data,
        orden: 0, // ✅ valor por defecto técnico
      },
    });
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
