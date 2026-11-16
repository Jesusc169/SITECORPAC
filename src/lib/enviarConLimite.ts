/**
 * fetch con tiempo límite para los formularios del panel (noticias, ferias,
 * sorteos). Sin esto, si la subida de fotos se queda colgada (internet lento,
 * conexión que se cae), la pantalla espera para siempre sin ningún mensaje y
 * la secretaria vuelve a darle "Guardar" una y otra vez (incidente del
 * 13-nov-2026: 62 envíos colgados de una feria sin respuesta ni aviso).
 */
export const LIMITE_GUARDADO_MS = 30_000;

export const MENSAJE_TIEMPO_AGOTADO =
  "La subida está tardando demasiado (más de 30 segundos). Revisa tu internet o usa fotos más livianas. " +
  "Antes de volver a intentar, revisa la lista: puede que sí se haya guardado.";

export async function enviarConLimite(
  url: string,
  init: RequestInit,
  limiteMs: number = LIMITE_GUARDADO_MS
): Promise<Response> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), limiteMs);
  try {
    return await fetch(url, { ...init, signal: controlador.signal });
  } catch (error) {
    if (controlador.signal.aborted) throw new Error(MENSAJE_TIEMPO_AGOTADO);
    throw new Error("No se pudo conectar con el servidor. Revisa tu internet e inténtalo de nuevo.", {
      cause: error,
    });
  } finally {
    clearTimeout(temporizador);
  }
}
