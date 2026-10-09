// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarActividad } from "@/lib/registro";

export async function POST(req: Request) {
  const usuario = await obtenerUsuarioActual().catch(() => null);
  if (usuario) {
    await registrarActividad({ usuario, accion: "logout", modulo: "sesion", detalle: "Cerró sesión", request: req });
  }

  const response = NextResponse.json({
    message: "Logout exitoso",
  });

  // 🧹 Eliminar cookie de sesión
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // ⛔ expira inmediatamente
  });

  return response;
}
