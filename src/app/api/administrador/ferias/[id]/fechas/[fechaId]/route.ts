import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   PUT – editar fecha
   ========================= */
export async function PUT(
  request: Request,
  { params }: { params: { fechaId: string } }
) {
  const id = Number(params.fechaId);
  const body = await request.json();

  const fecha = await prisma.evento_feria_fecha.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(fecha);
}

/* =========================
   DELETE – eliminar fecha
   ========================= */
export async function DELETE(
  _: Request,
  { params }: { params: { fechaId: string } }
) {
  const id = Number(params.fechaId);

  await prisma.evento_feria_fecha.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
