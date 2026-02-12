import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// 📥 GET → LISTAR SORTEOS
// =====================================================
export async function GET() {
  try {
    const sorteos = await prisma.sorteo.findMany({
      include: {
        sorteo_producto: true,
      },
      orderBy: {
        fecha_hora: "desc",
      },
    });

    return NextResponse.json(sorteos);
  } catch (error) {
    console.error("ERROR LISTAR SORTEOS:", error);
    return NextResponse.json({ error: "Error listando" }, { status: 500 });
  }
}

// =====================================================
// ➕ POST → CREAR SORTEO
// =====================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      titulo,
      descripcion,
      fecha_hora,
      lugar,
      imagen,
      premios = [],
      anio,
    } = body;

    const fechaHora = fecha_hora ? new Date(fecha_hora) : new Date();

    const nuevo = await prisma.sorteo.create({
      data: {
        nombre: titulo,
        descripcion,
        imagen,
        lugar,
        fecha_hora: fechaHora,
        anio: anio || fechaHora.getFullYear(),
        estado: "ACTIVO",
      },
    });

    // insertar premios
    if (premios.length > 0) {
      await prisma.sorteo_producto.createMany({
        data: premios.map((p: any) => ({
          sorteo_id: nuevo.id,
          nombre: p.nombre,
          descripcion: p.descripcion || "",
          cantidad: Number(p.cantidad) || 1,
        })),
      });
    }

    const completo = await prisma.sorteo.findUnique({
      where: { id: nuevo.id },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(completo);
  } catch (error) {
    console.error("ERROR CREAR:", error);
    return NextResponse.json({ error: "Error creando" }, { status: 500 });
  }
}
