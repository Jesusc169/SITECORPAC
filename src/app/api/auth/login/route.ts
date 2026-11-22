// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import {
  AuthController,
  CredencialesInvalidasError,
  CuentaDesactivadaError,
} from "../../../../controllers/AuthController";
import { opcionesCookieSesion } from "@/lib/auth";
import { estaBloqueado, registrarFallo, registrarExito, obtenerIp } from "@/lib/rateLimiter";
import { registrarActividad, registrarError } from "@/lib/registro";
import { ERROR_SISTEMA_LOGIN } from "@/lib/mensajes";

// Solo se guarda lo que parece un correo: si alguien escribió su contraseña
// en el campo equivocado, no debe quedar en el registro.
function correoParaRegistro(valor: string): string {
  const texto = valor.trim();
  return /^[^\s@]+@[^\s@]+$/.test(texto) ? texto.slice(0, 120) : "(no es un correo válido)";
}

/**
 * Un fallo del SISTEMA (base de datos caída, falta JWT_SECRET…) no es culpa
 * de quien entra: responde 500 con un texto claro, queda en el registro como
 * error y NO cuenta como intento fallido (no bloquea a nadie). Tampoco se
 * muestra el mensaje técnico.
 */
export async function POST(req: Request) {
  try {
    return await iniciarSesion(req);
  } catch (err) {
    await registrarError("sesion", "Inicio de sesión", err, req);
    return NextResponse.json({ error: ERROR_SISTEMA_LOGIN }, { status: 500 });
  }
}

async function iniciarSesion(req: Request) {
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

  // ===============================
  // Validación básica: correo y contraseña deben ser texto no vacío.
  // Un cuerpo que no es JSON (o con otros tipos) es 400 y no llega a la BD.
  // ===============================
  const body = await req.json().catch(() => null);
  const email: unknown = body?.email;
  const password: unknown = body?.password;
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
  }

  try {
    const { token, user } = await AuthController.login({ email, password });

    await registrarExito(ip);
    await registrarActividad({
      usuario: { id: user.id, nombre: user.nombre },
      accion: "login",
      modulo: "sesion",
      detalle: `Inició sesión (${user.rol})`,
      request: req,
    });

    // Cookie httpOnly (JS no puede leerla), 8 horas, igual que el JWT.
    // El token no se envía en el cuerpo.
    const response = NextResponse.json({ message: "Login exitoso", user });
    response.cookies.set("token", token, opcionesCookieSesion());
    return response;
  } catch (err) {
    if (err instanceof CuentaDesactivadaError) {
      // La contraseña era correcta: no cuenta como intento de adivinarla.
      await registrarActividad({
        accion: "login_fallido",
        modulo: "sesion",
        nivel: "aviso",
        detalle: `Intento de entrar con una cuenta desactivada. Correo: ${correoParaRegistro(email)}`,
        request: req,
      });
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    if (err instanceof CredencialesInvalidasError) {
      await registrarFallo(ip);
      await registrarActividad({
        accion: "login_fallido",
        modulo: "sesion",
        nivel: "aviso",
        detalle: `Correo o contraseña incorrectos. Correo: ${correoParaRegistro(email)}`,
        request: req,
      });
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    // Cualquier otra cosa es un fallo del sistema: lo maneja POST.
    throw err;
  }
}
