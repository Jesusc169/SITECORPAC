import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

/* GET */
export async function GET(_: Request, { params }: any) {
  const sesion = await verificarSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(
    await prisma.evento_feria_empresa.findMany({
      where: { feria_id: Number(params.id) },
      include: { empresa: true },
    })
  );
}

/* POST */
export async function POST(request: Request, { params }: any) {
  const sesion = await verificarSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const rel = await prisma.evento_feria_empresa.create({
    data: {
      feria_id: Number(params.id),
      empresa_id: body.empresa_id,
    },
  });

  return NextResponse.json(rel);
}
