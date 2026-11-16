import prisma from "@/lib/prisma";

/**
 * Freno en el servidor contra publicaciones duplicadas por varios clics en
 * "Guardar" (incidente del 13-nov-2026: ~33 ferias iguales en 2 minutos).
 * El botón del panel ya se bloquea mientras guarda; esto cubre lo que el
 * navegador no puede evitar (dos pestañas, recargar a mitad de la subida,
 * reintentar después del aviso de 30 s cuando el primero sí llegó).
 *
 * Prisma guarda la fecha de creación en UTC (aunque MySQL esté en hora de
 * Perú, como en la PC de desarrollo), así que se compara con UTC_TIMESTAMP()
 * del propio MySQL y no con NOW() ni con la hora de Node.
 */
export const VENTANA_DUPLICADO_SEG = 120;

export type TipoPublicacion = "noticia" | "feria" | "sorteo";

const NOMBRE: Record<TipoPublicacion, string> = {
  noticia: "una noticia",
  feria: "una feria",
  sorteo: "un sorteo",
};

export function mensajeDuplicado(tipo: TipoPublicacion): string {
  return (
    `Ya se guardó ${NOMBRE[tipo]} con este mismo título hace un momento. ` +
    "Revisa la lista: no hace falta volver a guardarla."
  );
}

export async function hayDuplicadoReciente(tipo: TipoPublicacion, titulo: string): Promise<boolean> {
  const filas = await consultar(tipo, titulo.trim());
  return Number(filas[0].n) > 0;
}

function consultar(tipo: TipoPublicacion, titulo: string): Promise<{ n: bigint | number }[]> {
  switch (tipo) {
    case "noticia":
      return prisma.$queryRaw`SELECT COUNT(*) AS n FROM noticia
        WHERE titulo = ${titulo} AND createdAt >= UTC_TIMESTAMP() - INTERVAL ${VENTANA_DUPLICADO_SEG} SECOND`;
    case "feria":
      return prisma.$queryRaw`SELECT COUNT(*) AS n FROM evento_feria
        WHERE titulo = ${titulo} AND created_at >= UTC_TIMESTAMP() - INTERVAL ${VENTANA_DUPLICADO_SEG} SECOND`;
    case "sorteo":
      return prisma.$queryRaw`SELECT COUNT(*) AS n FROM sorteo
        WHERE nombre = ${titulo} AND creado_en >= UTC_TIMESTAMP() - INTERVAL ${VENTANA_DUPLICADO_SEG} SECOND`;
  }
}
