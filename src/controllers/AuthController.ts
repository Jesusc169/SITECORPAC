import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { firmarTokenSesion } from "../lib/auth";

/** Contraseña correcta, pero la cuenta fue desactivada por un administrador. */
export class CuentaDesactivadaError extends Error {
  constructor() {
    super("Tu cuenta está desactivada. Comunícate con el administrador del sitio.");
  }
}

// Hash "señuelo" para comparar contra él cuando el correo no existe, así el
// tiempo de respuesta no delata si la cuenta existe o no.
const HASH_SENUELO = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q0BUqR8Jy2/PS.zRfhbW.gKAeGmXm";

export class AuthController {
  static async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Mismo mensaje y siempre se ejecuta bcrypt.compare, exista o no la
    // cuenta, para no dejar adivinar por el error ni por el tiempo de
    // respuesta qué correos tienen cuenta en el sitio.
    const isValid = await bcrypt.compare(password, user?.password ?? HASH_SENUELO);
    if (!user || !isValid) throw new Error("Credenciales inválidas");
    // Solo se avisa DESPUÉS de validar la contraseña: así no se puede usar
    // este mensaje para averiguar qué correos tienen cuenta.
    if (!user.activo) throw new CuentaDesactivadaError();

    // 8h, igual que el maxAge de la cookie en /api/auth/login — antes el
    // JWT duraba 24h pero la cookie se borraba a las 8h, una inconsistencia
    // inofensiva (el navegador descarta la cookie primero) pero confusa.
    const token = firmarTokenSesion(user);

    const { password: _password, sesionVersion: _sv, ...userSinPassword } = user;

    return { token, user: userSinPassword };
  }
}
