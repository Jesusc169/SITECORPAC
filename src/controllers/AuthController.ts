import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthController {
  static async login(data: { email: string; password: string }) {
    const { email, password } = data;

    // 1. buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Usuario no encontrado");

    // 2. comparar password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Contraseña incorrecta");

    // 3. generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return { token, user };
  }
}
