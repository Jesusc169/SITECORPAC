// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { AuthController } from "../../../../controllers/AuthController";
import { estaBloqueado, registrarFallo, registrarExito, obtenerIp } from "@/lib/rateLimiter";
import { registrarActividad } from "@/lib/registro";

// Solo se guarda lo que parece un correo: si alguien escribió su contraseña
// en el campo equivocado, no debe quedar en el registro.
function correoParaRegistro(valor: unknown): string {
  const texto = typeof valor === "string" ? valor.trim() : "";
  return /^[^\s@]+@[^\s@]+$/.test(texto) ? texto.slice(0, 120) : "(no es un correo válido)";
}

export async function POST(req: Request) {
  const ip = obtenerIp(req);

  // ===============================
  // Bloqueo por intentos fallidos
  // ===============================
  const bloqueadoHasta = await estaBloqueado(ip);
  if (bloqueadoHasta) {
    const minutos = Math.max(1, Math.ceil((bloqueadoHasta - Date.now()) / 60000));
    await registrarActividad({
      accion: "login_bloqueado",
      modulo: "sesion",
      nivel: "aviso",
      detalle: `Intento de inicio de sesión desde una IP bloqueada (faltan ${minutos} min)`,
      request: req,
    });
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).` },
      { status: 429 }
    );
  }

  let correoIntentado: unknown = null;

  try {
    const body = await req.json();
    correoIntentado = body?.email;

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
    await registrarActividad({
      usuario: { id: user.id, nombre: user.nombre },
      accion: "login",
      modulo: "sesion",
      detalle: `Inició sesión (${user.rol})`,
      request: req,
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
    await registrarFallo(ip);
    await registrarActividad({
      accion: "login_fallido",
      modulo: "sesion",
      nivel: "aviso",
      detalle: `Correo o contraseña incorrectos. Correo: ${correoParaRegistro(correoIntentado)}`,
      request: req,
    });
    return NextResponse.json(
      { error: err.message || "Credenciales inválidas" },
      { status: 401 }
    );
  }
}
