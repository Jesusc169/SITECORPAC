/**
 * Registro de actividad (bitácora) del panel.
 *
 * Guarda en la tabla `registro_actividad` quién hizo qué y cuándo, y los
 * errores del servidor, para revisarlos desde /admin/sistema sin entrar al
 * servidor. Registrar NUNCA debe romper la acción principal: si guardar el
 * registro falla, solo se escribe en el log de PM2 y se sigue.
 */
import prisma from "@/lib/prisma";
import { obtenerIp } from "@/lib/rateLimiter";

export const MODULOS_REGISTRO = [
  "noticias",
  "ferias",
  "sorteos",
  "directorio",
  "usuarios",
  "sesion",
  "sistema",
] as const;
export type ModuloRegistro = (typeof MODULOS_REGISTRO)[number];

export type AccionRegistro =
  | "crear"
  | "editar"
  | "eliminar"
  | "duplicar"
  | "login"
  | "login_fallido"
  | "login_bloqueado"
  | "logout"
  | "desbloquear_ip"
  | "error";

export const NIVELES_REGISTRO = ["info", "aviso", "error"] as const;
export type NivelRegistro = (typeof NIVELES_REGISTRO)[number];

// Plazo declarado en /privacidad; si cambia, actualizar ahí también.
export const RETENCION_REGISTRO_DIAS = 180;

const MAX_DETALLE = 500;

export interface ActorRegistro {
  id: number;
  nombre: string;
}

export interface DatosRegistro {
  usuario?: ActorRegistro | null;
  accion: AccionRegistro;
  modulo: ModuloRegistro;
  entidadId?: number | null;
  detalle?: string | null;
  request?: Request | null;
  nivel?: NivelRegistro;
}

/** Recorta el texto al largo de la columna, sin cortar a medio carácter. */
export function recortarDetalle(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return null;
  const chars = Array.from(limpio);
  return chars.length > MAX_DETALLE
    ? chars.slice(0, MAX_DETALLE - 1).join("") + "…"
    : limpio;
}

export async function registrarActividad(datos: DatosRegistro): Promise<void> {
  try {
    await prisma.registro_actividad.create({
      data: {
        usuarioId: datos.usuario?.id ?? null,
        usuario: datos.usuario?.nombre?.slice(0, 120) ?? null,
        accion: datos.accion,
        modulo: datos.modulo,
        entidadId: datos.entidadId ?? null,
        detalle: recortarDetalle(datos.detalle),
        ip: datos.request ? obtenerIp(datos.request).slice(0, 64) : null,
        nivel: datos.nivel ?? "info",
      },
    });
  } catch (e) {
    console.error("No se pudo guardar el registro de actividad:", e);
  }
}

/** Mensaje legible de cualquier cosa lanzada con throw. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Para los catch de las rutas: deja el error en el log de PM2 (como antes)
 * y además en el registro, con qué se estaba intentando hacer.
 */
export async function registrarError(
  modulo: ModuloRegistro,
  contexto: string,
  error: unknown,
  request?: Request | null
): Promise<void> {
  console.error(`${contexto}:`, error);
  await registrarActividad({
    accion: "error",
    modulo,
    nivel: "error",
    detalle: `${contexto}: ${mensajeDeError(error)}`,
    request,
  });
}

/** Borra los registros más antiguos que el plazo de retención. */
export async function depurarRegistroAntiguo(): Promise<number> {
  const limite = new Date(Date.now() - RETENCION_REGISTRO_DIAS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.registro_actividad.deleteMany({
    where: { fecha: { lt: limite } },
  });
  return count;
}

/**
 * Título o nombre de un registro, para que la bitácora diga «eliminó la
 * noticia "X"» y no solo «eliminó la noticia 23». Se llama ANTES de borrar.
 */
export async function nombreEntidad(
  modulo: ModuloRegistro,
  id: number
): Promise<string | null> {
  try {
    switch (modulo) {
      case "noticias":
        return (await prisma.noticia.findUnique({ where: { id }, select: { titulo: true } }))?.titulo ?? null;
      case "ferias":
        return (await prisma.evento_feria.findUnique({ where: { id }, select: { titulo: true } }))?.titulo ?? null;
      case "sorteos":
        return (await prisma.sorteo.findUnique({ where: { id }, select: { nombre: true } }))?.nombre ?? null;
      case "directorio": {
        const m = await prisma.directorio.findUnique({ where: { id }, select: { nombre: true, cargo: true } });
        return m ? `${m.nombre} (${m.cargo})` : null;
      }
      case "usuarios": {
        const u = await prisma.user.findUnique({ where: { id }, select: { nombre: true, email: true } });
        return u ? `${u.nombre} <${u.email}>` : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** El `id` del objeto que devuelve un controlador, si lo tiene. */
export function idDe(obj: unknown): number | null {
  if (obj && typeof obj === "object" && "id" in obj) {
    const id = (obj as { id: unknown }).id;
    return typeof id === "number" ? id : null;
  }
  return null;
}

/** Texto del interruptor "Visible en el sitio web" para el detalle. */
export function textoVisible(activo: boolean | null | undefined): string {
  return activo === false ? "no visible en el sitio" : "visible en el sitio";
}
