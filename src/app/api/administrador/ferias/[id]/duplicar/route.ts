import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    /* =========================
       FIX NEXT 15 PARAMS PROMISE
    ========================= */
    const { id } = await context.params;
    const feriaId = Number(id);

    if (!feriaId) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    /* =========================
       1. FERIA ORIGINAL
    ========================= */
    const feriaOriginal = await prisma.evento_feria.findUnique({
      where: { id: feriaId },
      include: {
        evento_feria_empresa: true,
        evento_feria_fecha: true,
      },
    });

    if (!feriaOriginal) {
      return NextResponse.json(
        { error: "Feria no encontrada" },
        { status: 404 }
      );
    }

    /* =========================
       2. CREAR NUEVA FERIA
       🔥 anio es obligatorio
    ========================= */
    const nuevaFeria = await prisma.evento_feria.create({
      data: {
        titulo: feriaOriginal.titulo + " (Copia)",
        descripcion: feriaOriginal.descripcion ?? "",
        imagen_portada: feriaOriginal.imagen_portada ?? null,
        estado: feriaOriginal.estado ?? true,
        anio: new Date().getFullYear(), // 🔥 OBLIGATORIO
      },
    });

    /* =========================
       3. DUPLICAR EMPRESAS
    ========================= */
    if (feriaOriginal.evento_feria_empresa.length > 0) {
      await prisma.evento_feria_empresa.createMany({
        data: feriaOriginal.evento_feria_empresa.map((e) => ({
          feria_id: nuevaFeria.id,
          empresa_id: e.empresa_id,
        })),
      });
    }

    /* =========================
       4. DUPLICAR FECHAS
    ========================= */
    if (feriaOriginal.evento_feria_fecha.length > 0) {
      await prisma.evento_feria_fecha.createMany({
        data: feriaOriginal.evento_feria_fecha.map((f) => ({
          feria_id: nuevaFeria.id,
          fecha: f.fecha,
          ubicacion: f.ubicacion,
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          zona: f.zona ?? null,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Feria duplicada correctamente",
      nuevaFeria,
    });

  } catch (error) {
    console.error("ERROR DUPLICAR:", error);

    return NextResponse.json(
      { error: "Error interno al duplicar feria" },
      { status: 500 }
    );
  }
}
