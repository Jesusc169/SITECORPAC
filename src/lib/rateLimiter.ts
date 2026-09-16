/**
 * Bloqueo de intentos de login por IP, guardado en la base de datos
 * (tabla `login_intento`) en vez de en memoria: PM2 corre la app en modo
 * cluster (varios procesos), y cada uno tiene su propia memoria, así que un
 * contador en memoria daría un límite distinto según qué worker atendiera
 * cada petición. La base de datos es el único estado que todos comparten.
 */
import prisma from "@/lib/prisma";

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;

/** Devuelve el timestamp (ms) hasta el que sigue bloqueado, o null si puede intentar. */
export async function estaBloqueado(ip: string): Promise<number | null> {
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
