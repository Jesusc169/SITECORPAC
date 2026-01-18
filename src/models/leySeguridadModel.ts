import prisma from "@/lib/prisma";

/**
 * Contenido activo de la Ley de Seguridad y Salud en el Trabajo
 */
export async function obtenerContenidoLeySeguridad() {
  return prisma.ley_seguridad_contenido.findMany({
    where: { estado: 1 },
    orderBy: { orden: "asc" },
  });
}
