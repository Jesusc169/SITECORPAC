import { revalidateTag } from "next/cache";

/**
 * Expira al instante la caché pública de un módulo ("noticias", "ferias",
 * "sorteos", "directorio") después de crear, editar, ocultar o eliminar.
 *
 * Con el perfil "max" que se usaba antes, Next 16 sirve UNA vez más la versión
 * vieja y la regenera en segundo plano: el primer visitante después de ocultar
 * una noticia todavía la veía. `{ expire: 0 }` la descarta en el acto.
 */
export function invalidarCache(tag: string): void {
  revalidateTag(tag, { expire: 0 });
}
