import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d", algorithm: "HS256" }
    );

    const { password: _password, ...userSinPassword } = user;

    return { token, user: userSinPassword };
  }
}
