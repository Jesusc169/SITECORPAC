/**
 * Ruta de una imagen guardada en la base: si es una URL completa o ya empieza
 * con "/", se usa tal cual; si no ("uploads/x.jpg"), se le agrega "/".
 */
export function rutaPublica(url: string): string {
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return "/" + url;
}
