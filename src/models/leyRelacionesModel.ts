import { prisma } from "@/lib/prisma";

export const obtenerLeyRelaciones = async () => {
  return prisma.ley_relaciones_colectivas.findFirst({
    where: { estado: 1 },
  });
};
