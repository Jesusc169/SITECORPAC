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
   PUT – Editar feria
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

    let imagen_portada: string | null = null;

    /* ====== SI VIENE IMAGEN ====== */
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

    const feria = await prisma.evento_feria.update({
      where: { id: feriaId },
      data: {
        titulo,
        descripcion,
        ...(imagen_portada && { imagen_portada }),
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
