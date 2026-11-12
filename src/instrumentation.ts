/**
 * Se ejecuta una vez al arrancar cada proceso del sitio (Next.js).
 * Arranca el procesador que comprime los videos subidos en segundo plano.
 *
 * Si algo falla acá, el sitio sigue funcionando igual (solo los videos
 * quedarían esperando): un error en register() deja TODAS las páginas en 500.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { iniciarProcesador } = await import("@/lib/videos/procesador");
    iniciarProcesador();
  } catch (e) {
    console.error("No se pudo iniciar el procesador de videos:", e);
  }
}
