import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export interface SesionUsuario {
  id: number;
  email: string;
  rol: string;
  // Versión de sesión del usuario al momento de firmar (user.sesionVersion).
  // Los tokens anteriores a este cambio no la traen: cuentan como 0.
  sv?: number;
}

export const DURACION_SESION_SEG = 60 * 60 * 8; // 8 horas

/** Firma el JWT de sesión (lo usan el login y el cambio de la propia contraseña). */
export function firmarTokenSesion(usuario: {
  id: number;
  email: string;
  rol: string;
  sesionVersion: number;
}): string {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, sv: usuario.sesionVersion },
    process.env.JWT_SECRET as string,
    { expiresIn: DURACION_SESION_SEG, algorithm: "HS256" }
  );
}

/** Opciones de la cookie httpOnly de sesión. */
export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACION_SESION_SEG,
  };
}

/**
 * Verifica la cookie de sesión (JWT httpOnly) de la petición actual.
 * Devuelve los datos del usuario si es válida, o null si no hay
 * sesión o el token es inválido/expiró.
 *
 * Usar al inicio de cada endpoint de /api/administrador/*:
 *   const sesion = await verificarSesion();
 *   if (!sesion) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
 */
export async function verificarSesion(): Promise<SesionUsuario | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as SesionUsuario;
  } catch {
    return null;
  }
}

/**
 * Igual que verificarSesion(), pero trae el usuario fresco desde la
 * base de datos (rol y permisos actuales) en vez de confiar en lo
 * que decía el JWT al momento de loguearse. Úsalo cuando necesites
 * revisar permisos, para que un cambio de privilegios aplique al
 * instante sin esperar a que la persona vuelva a iniciar sesión.
 *
 * También corta la sesión si la cuenta fue desactivada o si su
 * sesionVersion subió (cambio de contraseña, "cerrar sesiones"): un JWT
 * no se puede anular por sí solo, así que esta comparación es la que
 * hace efectivo el cierre a distancia.
 */
export async function obtenerUsuarioActual() {
  const sesion = await verificarSesion();
  if (!sesion) return null;

  const usuario = await prisma.user.findUnique({ where: { id: sesion.id } });
  if (!sesionVigente(sesion, usuario)) return null;
  return usuario;
}

export function sesionVigente(
  sesion: Pick<SesionUsuario, "sv">,
  usuario: { activo: boolean; sesionVersion: number } | null
): boolean {
  if (!usuario?.activo) return false;
  return (sesion.sv ?? 0) === usuario.sesionVersion;
}
