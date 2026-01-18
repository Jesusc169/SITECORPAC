import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// ✅ Registro
export async function register(req: NextRequest) {
  try {
    const { nombre, email, password, rol } = await req.json();

    // 1. verificar si ya existe
    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
    }

    // 2. encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. guardar en DB
    const newUser = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol, // 👈 tu campo en prisma
      },
    });

    return NextResponse.json({ message: "Usuario registrado", user: newUser }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

// ✅ Login
export async function login(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1. buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    // 2. comparar password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });
    }

    // 3. generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET as string, // 👈 definido en tu .env
      { expiresIn: "1d" }
    );

    return NextResponse.json({ message: "Login exitoso", token });
  } catch (err) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
