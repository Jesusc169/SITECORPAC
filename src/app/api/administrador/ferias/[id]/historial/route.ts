import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: any) {
  const feriaId = Number(params.id);

  const historial = await prisma.feria_historial.findMany({
    where: { feria_id: feriaId },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(historial);
}
