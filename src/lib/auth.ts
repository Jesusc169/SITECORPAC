import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export interface SesionUsuario {
  id: number;
  email: string;
  rol: string;
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
    return jwt.verify(token, process.env.JWT_SECRET as string) as SesionUsuario;
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
 */
export async function obtenerUsuarioActual() {
  const sesion = await verificarSesion();
  if (!sesion) return null;

  return prisma.user.findUnique({ where: { id: sesion.id } });
}
