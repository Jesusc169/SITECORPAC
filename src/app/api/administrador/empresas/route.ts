import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const empresas = await prisma.empresa.findMany({
      orderBy: { nombre: "asc" }, // opcional: orden alfabético
      select: {
        id: true,
        nombre: true,
      },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}
