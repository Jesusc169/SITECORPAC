import prisma from "@/lib/prisma";

export const EmpresaModel = {
  obtenerNombres: async () => {
    return prisma.empresa.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    });
  },
};
