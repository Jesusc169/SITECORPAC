import { prisma } from "@/lib/prisma";

export const obtenerEstatuto = async () => {
  return prisma.estatuto_contenido.findFirst({
    where: { estado: 1 },
  });
};
