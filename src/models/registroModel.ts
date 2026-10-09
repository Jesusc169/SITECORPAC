import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface FiltrosRegistro {
  desde?: Date | null;
  hasta?: Date | null;
  modulo?: string | null;
  nivel?: string | null;
  // número = id de usuario; "anonimo" = acciones sin usuario (intentos
  // de login fallidos, errores del sistema)
  usuario?: number | "anonimo" | null;
  texto?: string | null;
}

function construirWhere(f: FiltrosRegistro): Prisma.registro_actividadWhereInput {
  const where: Prisma.registro_actividadWhereInput = {};

  if (f.desde || f.hasta) {
    where.fecha = {
      ...(f.desde ? { gte: f.desde } : {}),
      ...(f.hasta ? { lte: f.hasta } : {}),
    };
  }
  if (f.modulo) where.modulo = f.modulo;
  if (f.nivel) where.nivel = f.nivel;
  if (f.usuario === "anonimo") where.usuarioId = null;
  else if (typeof f.usuario === "number") where.usuarioId = f.usuario;
  if (f.texto) {
    where.OR = [
      { detalle: { contains: f.texto } },
      { usuario: { contains: f.texto } },
      { ip: { contains: f.texto } },
    ];
  }
  return where;
}

export const RegistroModel = {
  listar: (f: FiltrosRegistro, saltar: number, tomar: number) =>
    prisma.registro_actividad.findMany({
      where: construirWhere(f),
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: saltar,
      take: tomar,
    }),

  contar: (f: FiltrosRegistro) =>
    prisma.registro_actividad.count({ where: construirWhere(f) }),

  contarDesde: (desde: Date, extra: Prisma.registro_actividadWhereInput = {}) =>
    prisma.registro_actividad.count({ where: { fecha: { gte: desde }, ...extra } }),

  ultimosErrores: (tomar: number) =>
    prisma.registro_actividad.findMany({
      where: { nivel: "error" },
      orderBy: { fecha: "desc" },
      take: tomar,
    }),

  /** Último inicio de sesión y última acción de cada usuario. */
  resumenPorUsuario: async (desdeActividad: Date) => {
    const [ultimosLogin, ultimasAcciones, accionesPeriodo] = await Promise.all([
      prisma.registro_actividad.groupBy({
        by: ["usuarioId"],
        where: { accion: "login", usuarioId: { not: null } },
        _max: { fecha: true },
      }),
      prisma.registro_actividad.groupBy({
        by: ["usuarioId"],
        where: { usuarioId: { not: null } },
        _max: { fecha: true },
      }),
      prisma.registro_actividad.groupBy({
        by: ["usuarioId"],
        where: {
          usuarioId: { not: null },
          fecha: { gte: desdeActividad },
          accion: { in: ["crear", "editar", "eliminar", "duplicar"] },
        },
        _count: { _all: true },
      }),
    ]);
    return { ultimosLogin, ultimasAcciones, accionesPeriodo };
  },

  usuariosDelSistema: () =>
    prisma.user.findMany({
      select: { id: true, nombre: true, email: true, rol: true, permisos: true, createdAt: true },
      orderBy: { nombre: "asc" },
    }),

  intentosLogin: () =>
    prisma.login_intento.findMany({ orderBy: { primerFalloEn: "desc" }, take: 100 }),

  desbloquearIp: (ip: string) =>
    prisma.login_intento.deleteMany({ where: { ip } }),

  totales: async () => {
    const [noticias, ferias, sorteos, directorio, usuarios, registro] = await Promise.all([
      prisma.noticia.count(),
      prisma.evento_feria.count(),
      prisma.sorteo.count(),
      prisma.directorio.count(),
      prisma.user.count(),
      prisma.registro_actividad.count(),
    ]);
    return { noticias, ferias, sorteos, directorio, usuarios, registro };
  },

  /** Tamaño en bytes de la base de datos actual (datos + índices). */
  tamanoBaseDatos: async (): Promise<number | null> => {
    const filas = await prisma.$queryRaw<{ bytes: bigint | number | null }[]>`
      SELECT SUM(data_length + index_length) AS bytes
      FROM information_schema.TABLES
      WHERE table_schema = DATABASE()`;
    const b = filas[0]?.bytes;
    return b == null ? null : Number(b);
  },

  ping: async (): Promise<number> => {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return Date.now() - t0;
  },
};
