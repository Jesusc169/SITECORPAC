import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sorteos = await prisma.sorteo.findMany({
      include: { sorteo_producto: true },
      orderBy: { fecha_hora: "desc" },
    });
    return NextResponse.json(sorteos);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(req: Request) {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();

    const creado = await prisma.sorteo.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        lugar: data.lugar,
        fecha_hora: new Date(data.fecha_hora),
        imagen: data.imagen || null,
        anio: data.anio ?? new Date().getFullYear(),
        sorteo_producto: {
          create: data.premios?.map((p: any) => ({
            nombre: p.nombre,
            descripcion: p.descripcion,
            cantidad: p.cantidad ?? 1,
          })) || [],
        },
      },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(creado);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function PUT(req: Request) {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const actualizado = await prisma.sorteo.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        lugar: data.lugar,
        fecha_hora: new Date(data.fecha_hora),
        imagen: data.imagen || null,
        anio: data.anio ?? new Date().getFullYear(), // 💡 nunca null
      },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(actualizado);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function DELETE(req: Request) {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();
    await prisma.sorteo.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}
