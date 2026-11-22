// Mensajes de error para MOSTRAR en pantalla (navegador). Nunca dejan ver
// jerga técnica ("Failed to fetch", "Unexpected token <", textos de Prisma).
// Para el registro interno con detalle técnico está mensajeDeError en
// registro.ts: no mezclarlos.

export const ERROR_SISTEMA_LOGIN =
  "No pudimos iniciar sesión por un problema del sistema. Inténtalo de nuevo en unos minutos. Si sigue pasando, avisa al administrador.";
export const ERROR_CONEXION = "No pudimos conectar con el sistema. Revisa tu internet e inténtalo de nuevo.";
export const ERROR_SISTEMA = "Ocurrió un problema en el sistema. Inténtalo de nuevo.";

/**
 * Texto para la persona a partir de algo lanzado. Los errores propios del
 * navegador (red caída, JSON roto) se reemplazan por el texto por defecto.
 */
export function mensajeDe(e: unknown, porDefecto: string): string {
  if (e instanceof TypeError || e instanceof SyntaxError) return porDefecto;
  return (e instanceof Error && e.message) || porDefecto;
}

/** Lee el JSON de una respuesta; si no es JSON (p. ej. una página HTML de error) devuelve null. */
export async function leerJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** El mensaje de negocio `{ error: "..." }` que manda la API, si viene. */
export function errorDe(datos: unknown): string | undefined {
  if (datos && typeof datos === "object" && "error" in datos) {
    const { error } = datos as { error: unknown };
    if (typeof error === "string" && error) return error;
  }
  return undefined;
}

/** JSON de una respuesta correcta; si no, lanza Error con el `{error}` de la API o el texto por defecto. */
export async function jsonOError<T>(res: Response, porDefecto: string): Promise<T> {
  const datos = await leerJson(res);
  if (!res.ok || datos === null) throw new Error(errorDe(datos) ?? porDefecto);
  return datos as T;
}
