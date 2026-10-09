/**
 * Lectura de campos de un FormData del panel. Un campo que no llega nunca es
 * null: en columnas obligatorias eso terminaba en un error 500.
 */

/** Texto sin espacios a los costados; "" si el campo no llegó. */
export function campoTexto(fd: FormData, campo: string): string {
  return fd.get(campo)?.toString().trim() ?? "";
}

/** Como campoTexto, pero si quedó vacío devuelve `porDefecto`. */
export function campoTextoODefecto(fd: FormData, campo: string, porDefecto: string): string {
  const valor = campoTexto(fd, campo);
  return valor === "" ? porDefecto : valor;
}

/** Texto tal cual (sin recortar, p. ej. el cuerpo de una noticia); null si está vacío. */
export function campoOpcional(fd: FormData, campo: string): string | null {
  const valor = fd.get(campo)?.toString() ?? "";
  return valor === "" ? null : valor;
}

/**
 * Lista enviada como JSON en un campo (ids a quitar, premios, empresas...).
 * Si no llega, está mal escrita o no es una lista, devuelve [].
 */
export function campoLista<T = unknown>(fd: FormData, campo: string): T[] {
  try {
    const valor: unknown = JSON.parse(campoTextoODefecto(fd, campo, "[]"));
    return Array.isArray(valor) ? (valor as T[]) : [];
  } catch {
    return [];
  }
}
