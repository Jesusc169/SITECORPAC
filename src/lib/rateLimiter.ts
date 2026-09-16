/**
 * Bloqueo simple de intentos de login por IP. En memoria del proceso: como
 * PM2 corre esta app en modo "fork" (una sola instancia), esto alcanza para
 * frenar fuerza bruta sin sumar una dependencia nueva (Redis, etc). Se
 * reinicia si el proceso se reinicia — aceptable para este caso: el objetivo
 * es encarecer los intentos, no una garantía absoluta.
 */

interface RegistroIntentos {
  fallos: number;
  primerFalloEn: number;
  bloqueadoHasta: number | null;
}

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;

const intentos = new Map<string, RegistroIntentos>();

/** Devuelve el timestamp (ms) hasta el que sigue bloqueado, o null si puede intentar. */
export function estaBloqueado(clave: string): number | null {
  const registro = intentos.get(clave);
  if (!registro?.bloqueadoHasta) return null;

  if (Date.now() >= registro.bloqueadoHasta) {
    intentos.delete(clave);
    return null;
  }

  return registro.bloqueadoHasta;
}

export function registrarFallo(clave: string): void {
  const ahora = Date.now();
  const registro = intentos.get(clave);

  if (!registro || ahora - registro.primerFalloEn > VENTANA_MS) {
    intentos.set(clave, { fallos: 1, primerFalloEn: ahora, bloqueadoHasta: null });
    return;
  }

  registro.fallos++;
  if (registro.fallos >= MAX_INTENTOS) {
    registro.bloqueadoHasta = ahora + BLOQUEO_MS;
  }
}

export function registrarExito(clave: string): void {
  intentos.delete(clave);
}
