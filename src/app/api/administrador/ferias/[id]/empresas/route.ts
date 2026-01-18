import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* GET */
export async function GET(_: Request, { params }: any) {
  return NextResponse.json(
    await prisma.evento_feria_empresa.findMany({
      where: { feria_id: Number(params.id) },
      include: { empresa: true },
    })
  );
}

/* POST */
export async function POST(request: Request, { params }: any) {
  const body = await request.json();

  const rel = await prisma.evento_feria_empresa.create({
    data: {
      feria_id: Number(params.id),
      empresa_id: body.empresa_id,
    },
  });

  return NextResponse.json(rel);
}
