import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function DELETE(_: Request, { params }: any) {
  const sesion = await verificarSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.evento_feria_empresa.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ success: true });
}
