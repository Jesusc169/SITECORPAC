// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { AuthController } from "../../../../controllers/AuthController";
import { estaBloqueado, registrarFallo, registrarExito } from "@/lib/rateLimiter";

function obtenerIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "desconocida";
}

export async function POST(req: Request) {
  const ip = obtenerIp(req);

  // ===============================
  // Bloqueo por intentos fallidos
  // ===============================
  const bloqueadoHasta = await estaBloqueado(ip);
  if (bloqueadoHasta) {
    const minutos = Math.max(1, Math.ceil((bloqueadoHasta - Date.now()) / 60000));
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).` },
      { status: 429 }
    );
  }

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

    await registrarExito(ip);

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
    await registrarFallo(ip);
    return NextResponse.json(
      { error: err.message || "Credenciales inválidas" },
      { status: 401 }
    );
  }
}
