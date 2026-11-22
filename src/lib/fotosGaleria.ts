// Lista de fotos para mostrar en el sitio público (noticias, ferias, sorteos).

export interface FotoGaleria {
  url: string;
  principal: boolean;
}

/**
 * URLs de la galería con la foto principal primero; las demás conservan su
 * orden y se descartan las que están en blanco. Si ninguna está marcada como
 * principal, va primero la que coincide con la imagen antigua (la portada que
 * eligió la secretaria). Si la galería está vacía se usa esa imagen, si hay.
 */
export function fotosPrincipalPrimero(
  imagenes: readonly FotoGaleria[] | null | undefined,
  respaldo?: string | null,
): string[] {
  const portada = respaldo?.trim() ?? "";
  const validas = (imagenes ?? [])
    .map((img) => ({ url: img.url.trim(), principal: img.principal }))
    .filter((img) => img.url !== "");
  const hayPrincipal = validas.some((img) => img.principal);
  const esPrimera = (img: FotoGaleria) => (hayPrincipal ? img.principal : img.url === portada);
  const urls = validas.sort((a, b) => Number(esPrimera(b)) - Number(esPrimera(a))).map((img) => img.url);
  if (urls.length > 0) return urls;
  return portada ? [portada] : [];
}
