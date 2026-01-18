import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const feriaId = Number(params.id);

    if (isNaN(feriaId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const feriaOriginal = await prisma.evento_feria.findUnique({
      where: { id: feriaId },
      include: {
        evento_feria_fecha: true,
        evento_feria_empresa: true,
      },
    });

    if (!feriaOriginal) {
      return NextResponse.json(
        { error: "Feria no encontrada" },
        { status: 404 }
      );
    }

    const nuevaFeria = await prisma.evento_feria.create({
      data: {
        titulo: `${feriaOriginal.titulo} (Copia)`,
        descripcion: feriaOriginal.descripcion,
        imagen_portada: feriaOriginal.imagen_portada,
        anio: new Date().getFullYear(), // obligatorio
        estado: true, // ✅ BOOLEANO (NO STRING)

        evento_feria_fecha: {
          create: feriaOriginal.evento_feria_fecha.map((f) => ({
            fecha: f.fecha,
            hora_inicio: f.hora_inicio,
            hora_fin: f.hora_fin,
            ubicacion: f.ubicacion,
            zona: f.zona,
          })),
        },

        evento_feria_empresa: {
          create: feriaOriginal.evento_feria_empresa.map((e) => ({
            empresa_id: e.empresa_id,
          })),
        },
      },
    });

    return NextResponse.json(nuevaFeria, { status: 201 });
  } catch (error) {
    console.error("Error duplicando feria:", error);
    return NextResponse.json(
      { error: "Error duplicando feria" },
      { status: 500 }
    );
  }
}
