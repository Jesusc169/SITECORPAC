import { NextResponse } from "next/server";
import {
  obtenerSorteos,
  crearSorteo,
  actualizarSorteo,
  eliminarSorteo,
  duplicarSorteo,
} from "@/services/sorteo.service";

export async function GET() {
  const sorteos = await obtenerSorteos();
  return NextResponse.json(sorteos);
}

export async function POST(req: Request) {
  const data = await req.json();
  const sorteo = await crearSorteo(data);
  return NextResponse.json(sorteo);
}

export async function PUT(req: Request) {
  const data = await req.json();
  const sorteo = await actualizarSorteo(data);
  return NextResponse.json(sorteo);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await eliminarSorteo(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id } = await req.json();
  const sorteo = await duplicarSorteo(id);
  return NextResponse.json(sorteo);
}
