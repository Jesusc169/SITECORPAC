import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

/* =========================
   GET – Feria por ID
   ========================= */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const feriaId = Number(id);

  const feria = await prisma.evento_feria.findUnique({
    where: { id: feriaId },
    include: {
      evento_feria_fecha: true,
      evento_feria_empresa: {
        include: { empresa: true },
      },
    },
  });

  if (!feria) {
    return NextResponse.json({ error: "Feria no encontrada" }, { status: 404 });
  }

  return NextResponse.json(feria);
}

/* =========================
   PUT – Editar feria (FIX EMPRESAS + FECHAS)
   ========================= */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feriaId = Number(id);

    const formData = await req.formData();

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const file = formData.get("imagen_portada") as File | null;

    /* =========================
       🔥 LEER EMPRESAS Y FECHAS (AQUI ESTABA EL BUG)
       ========================= */
    const empresasRaw = formData.get("empresas") as string;
    const fechasRaw = formData.get("fechas") as string;

    const empresas: number[] = empresasRaw ? JSON.parse(empresasRaw) : [];
    const fechas: any[] = fechasRaw ? JSON.parse(fechasRaw) : [];

    let imagen_portada: string | null = null;

    /* =========================
       SUBIR IMAGEN
       ========================= */
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(
        process.cwd(),
        "public/uploads",
        fileName
      );

      await writeFile(filePath, buffer);
      imagen_portada = `/uploads/${fileName}`;
    }

    /* =========================
       UPDATE FERIA
       ========================= */
    await prisma.evento_feria.update({
      where: { id: feriaId },
      data: {
        titulo,
        descripcion,
        ...(imagen_portada && { imagen_portada }),
      },
    });

    /* =========================
       🔥 EMPRESAS (FIX REAL)
       ========================= */
    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: feriaId },
    });

    if (empresas.length > 0) {
      await prisma.evento_feria_empresa.createMany({
        data: empresas.map((empresa_id: number) => ({
          feria_id: feriaId,
          empresa_id,
        })),
      });
    }

    /* =========================
       🔥 FECHAS
       ========================= */
    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: feriaId },
    });

    if (fechas.length > 0) {
      await prisma.evento_feria_fecha.createMany({
        data: fechas.map((f: any) => ({
          feria_id: feriaId,
          fecha: new Date(f.fecha),
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          ubicacion: f.ubicacion,
          zona: f.zona || null,
        })),
      });
    }

    /* =========================
       RESPUESTA FINAL
       ========================= */
    const feria = await prisma.evento_feria.findUnique({
      where: { id: feriaId },
      include: {
        evento_feria_fecha: true,
        evento_feria_empresa: {
          include: { empresa: true },
        },
      },
    });

    return NextResponse.json(feria);
  } catch (error) {
    console.error("PUT FERIA ERROR:", error);
    return NextResponse.json(
      { error: "Error al actualizar feria" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE – Eliminar feria
   ========================= */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feriaId = Number(id);

    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: feriaId },
    });

    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: feriaId },
    });

    await prisma.evento_feria.delete({
      where: { id: feriaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al eliminar feria" },
      { status: 500 }
    );
  }
}
