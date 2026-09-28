/**
 * Bloqueo de intentos de login por IP, guardado en la base de datos
 * (tabla `login_intento`) en vez de en memoria: PM2 corre la app en modo
 * cluster (varios procesos), y cada uno tiene su propia memoria, así que un
 * contador en memoria daría un límite distinto según qué worker atendiera
 * cada petición. La base de datos es el único estado que todos comparten.
 */
import prisma from "@/lib/prisma";

/**
 * IP real del cliente detrás de nginx. `X-Forwarded-For` puede traer
 * cualquier valor que el cliente quiera al principio de la lista — nginx
 * (con `$proxy_add_x_forwarded_for`) solo AGREGA la IP real al final, no la
 * reemplaza. Confiar en el primer valor (como se hacía antes) dejaba
 * saltarse el bloqueo de fuerza bruta entero con solo mandar un
 * X-Forwarded-For distinto en cada intento. `X-Real-IP` sí es confiable: nginx
 * la fija con `$remote_addr`, que el cliente no puede sobrescribir.
 */
export function obtenerIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const partes = forwardedFor
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (partes.length) return partes[partes.length - 1];
  }

  return "desconocida";
}

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;
// La IP es un dato personal: no se guarda más de lo necesario. Un registro
// con más de 24h ya no sirve para nada (ventana y bloqueo duran 15 min).
// Este plazo es el que declara /privacidad; si cambia, actualizar ahí.
const RETENCION_MS = 24 * 60 * 60 * 1000;

/** Borra registros de intentos fallidos de más de 24 horas, de cualquier IP. */
export async function depurarIntentosAntiguos(): Promise<void> {
  await prisma.login_intento
    .deleteMany({ where: { primerFalloEn: { lt: new Date(Date.now() - RETENCION_MS) } } })
    .catch(() => {});
}

/** Devuelve el timestamp (ms) hasta el que sigue bloqueado, o null si puede intentar. */
export async function estaBloqueado(ip: string): Promise<number | null> {
  // Se aprovecha cada intento de login para depurar registros viejos.
  await depurarIntentosAntiguos();

  const registro = await prisma.login_intento.findUnique({ where: { ip } });
  if (!registro?.bloqueadoHasta) return null;

  const bloqueadoHastaMs = registro.bloqueadoHasta.getTime();
  if (Date.now() >= bloqueadoHastaMs) {
    await prisma.login_intento.delete({ where: { ip } }).catch(() => {});
    return null;
  }

  return bloqueadoHastaMs;
}

export async function registrarFallo(ip: string): Promise<void> {
  const ahora = new Date();
  const registro = await prisma.login_intento.findUnique({ where: { ip } });

  if (!registro || ahora.getTime() - registro.primerFalloEn.getTime() > VENTANA_MS) {
    await prisma.login_intento.upsert({
      where: { ip },
      create: { ip, fallos: 1, primerFalloEn: ahora, bloqueadoHasta: null },
      update: { fallos: 1, primerFalloEn: ahora, bloqueadoHasta: null },
    });
    return;
  }

  const fallos = registro.fallos + 1;
  await prisma.login_intento.update({
    where: { ip },
    data: {
      fallos,
      bloqueadoHasta: fallos >= MAX_INTENTOS ? new Date(ahora.getTime() + BLOQUEO_MS) : null,
    },
  });
}

export async function registrarExito(ip: string): Promise<void> {
  await prisma.login_intento.delete({ where: { ip } }).catch(() => {});
}
