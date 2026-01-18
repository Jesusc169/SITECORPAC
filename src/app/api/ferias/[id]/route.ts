import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

/* ===========================
   GET: obtener feria por ID
=========================== */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const feria = await prisma.evento_feria.findUnique({
      where: { id: Number(params.id) },
      include: {
        evento_feria_fecha: true,
        evento_feria_empresa: {
          include: { empresa: true },
        },
      },
    });

    if (!feria) {
      return NextResponse.json(
        { error: "Feria no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(feria);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener feria" },
      { status: 500 }
    );
  }
}

/* ===========================
   PUT: editar feria
=========================== */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const form = await req.formData();

    const titulo = String(form.get("titulo") || "");
    const descripcion = String(form.get("descripcion") || "");
    const anio = Number(form.get("anio"));
    const empresas = JSON.parse(String(form.get("empresas") || "[]"));
    const fechas = JSON.parse(String(form.get("fechas") || "[]"));
    const imagen = form.get("imagen") as File | null;

    let imagePath: string | undefined;

    /* ---- Imagen opcional ---- */
    if (imagen && imagen.size > 0) {
      const buffer = Buffer.from(await imagen.arrayBuffer());
      const fileName = `${Date.now()}-${imagen.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/ferias");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      imagePath = `/uploads/ferias/${fileName}`;
    }

    /* ---- Limpiar relaciones ---- */
    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: Number(params.id) },
    });

    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: Number(params.id) },
    });

    /* ---- Actualizar feria ---- */
    const feria = await prisma.evento_feria.update({
      where: { id: Number(params.id) },
      data: {
        titulo,
        descripcion,
        anio,
        ...(imagePath && { imagen_portada: imagePath }),
        evento_feria_fecha: {
          create: fechas.map((f: any) => ({
            fecha: new Date(f.fecha),
            hora_inicio: f.hora_inicio,
            hora_fin: f.hora_fin,
            ubicacion: f.ubicacion,
            zona: f.zona || null,
          })),
        },
        evento_feria_empresa: {
          create: empresas.map((id: number) => ({
            empresa_id: id,
          })),
        },
      },
    });

    return NextResponse.json(feria);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al actualizar feria" },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE: eliminar feria
=========================== */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: Number(params.id) },
    });

    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: Number(params.id) },
    });

    await prisma.evento_feria.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: "Feria eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al eliminar feria" },
      { status: 500 }
    );
  }
}
