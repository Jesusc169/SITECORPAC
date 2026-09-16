import { prisma } from "@/lib/prisma";

export const obtenerEstatuto = async () => {
  return prisma.estatuto_contenido.findFirst({
    where: { estado: 1 },
  });
};

export const contarEstatutoContenido = async () => {
  return prisma.estatuto_contenido.count();
};
