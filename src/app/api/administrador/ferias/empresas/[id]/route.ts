import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_: Request, { params }: any) {
  await prisma.evento_feria_empresa.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ success: true });
}
