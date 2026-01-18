import prisma from "@/lib/prisma";

/**
 * Contenido activo de la Constitución Política del Perú
 */
export async function obtenerContenidoConstitucion() {
  return prisma.constitucion_contenido.findMany({
    where: { estado: 1 },
    orderBy: { orden: "asc" },
  });
}
