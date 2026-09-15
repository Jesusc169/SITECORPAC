import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verificarSesion } from "@/lib/auth";

export async function GET(_: Request, { params }: any) {
  const sesion = await verificarSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const feriaId = Number(params.id);

  // 👈 Aquí usamos feria_historial tal como está en Prisma
  const historial = await prisma.feria_historial.findMany({
    where: { feria_id: feriaId },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(historial);
}
