// src/app/api/empresas/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { estado: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}
