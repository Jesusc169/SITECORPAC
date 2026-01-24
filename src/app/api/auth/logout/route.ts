// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
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
