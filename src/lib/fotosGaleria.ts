// Lista de fotos para mostrar en el sitio público (noticias, ferias, sorteos).

export interface FotoGaleria {
  url: string;
  principal: boolean;
}

/**
 * URLs de la galería con la foto principal primero; las demás conservan su
 * orden. Si la galería está vacía se usa la imagen antigua (respaldo), si hay.
 */
export function fotosPrincipalPrimero(
  imagenes: readonly FotoGaleria[] | null | undefined,
  respaldo?: string | null,
): string[] {
  const urls = [...(imagenes ?? [])]
    .sort((a, b) => Number(b.principal) - Number(a.principal))
    .map((img) => img.url);
  if (urls.length > 0) return urls;
  return respaldo?.trim() ? [respaldo] : [];
}
