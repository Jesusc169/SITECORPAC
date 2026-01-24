// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { AuthController } from "../../../../controllers/AuthController";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ===============================
    // Validación básica
    // ===============================
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Faltan credenciales" },
        { status: 400 }
      );
    }

    // ===============================
    // Login (AuthController)
    // ===============================
    const { token, user } = await AuthController.login({
      email: body.email,
      password: body.password,
    });

    // ===============================
    // RESPUESTA + COOKIE httpOnly
    // ===============================
    const response = NextResponse.json({
      message: "Login exitoso",
      user, // 👈 NO es necesario enviar el token al cliente
    });

    // 🔐 Cookie segura para middleware
    response.cookies.set("token", token, {
      httpOnly: true, // ⛔ JS no puede leerla
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // 👈 disponible para todo el sitio
      maxAge: 60 * 60 * 8, // 8 horas (ajusta si quieres)
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Credenciales inválidas" },
      { status: 401 }
    );
  }
}
