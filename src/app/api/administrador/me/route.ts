import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    permisos: usuario.permisos,
  });
}
