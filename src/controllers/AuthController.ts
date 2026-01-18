import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthController {
  static async register(data: { nombre: string; email: string; password: string; rol: string }) {
    const { nombre, email, password, rol } = data;

    // 1. verificar si ya existe
    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) throw new Error("El usuario ya existe");

    // 2. encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. guardar en DB
    const newUser = await prisma.user.create({
      data: { nombre, email, password: hashedPassword, rol },
    });

    return newUser;
  }

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
