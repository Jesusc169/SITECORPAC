import prisma from "@/lib/prisma";

/**
 * Contenido OIT activo
 */
export async function obtenerContenidoOIT() {
  return prisma.oit_contenido.findMany({
    where: { estado: 1 },
    orderBy: { orden: "asc" },
  });
}

