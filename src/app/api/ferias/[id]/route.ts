import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// cache corto para detalle
export const revalidate = 30;

/* ===========================
   GET – FERIA POR ID (OPTIMIZADO)
=========================== */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const feria = await prisma.evento_feria.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        anio: true,
        imagen_portada: true,
        created_at: true,

        evento_feria_fecha: {
          select: {
            id: true,
            fecha: true,
            hora_inicio: true,
            hora_fin: true,
            ubicacion: true,
            zona: true,
          },
        },

        evento_feria_empresa: {
          select: {
            empresa: {
              select: {
                id: true,
                nombre: true,
                logo_url: true,
              },
            },
          },
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
    console.error("ERROR GET FERIA ID:", error);
    return NextResponse.json(
      { error: "Error al obtener feria" },
      { status: 500 }
    );
  }
}

/* ===========================
   PUT – EDITAR FERIA (TRANSACCIONAL)
=========================== */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const form = await req.formData();

    const titulo = String(form.get("titulo") || "");
    const descripcion = String(form.get("descripcion") || "");
    const anio = Number(form.get("anio"));
    const empresas = JSON.parse(String(form.get("empresas") || "[]"));
    const fechas = JSON.parse(String(form.get("fechas") || "[]"));
    const imagen = form.get("imagen") as File | null;

    let imagePath: string | undefined;

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

    const feria = await prisma.$transaction(async (tx) => {
      await tx.evento_feria_fecha.deleteMany({
        where: { feria_id: id },
      });

      await tx.evento_feria_empresa.deleteMany({
        where: { feria_id: id },
      });

      return tx.evento_feria.update({
        where: { id },
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
            create: empresas.map((empresa_id: number) => ({
              empresa_id,
            })),
          },
        },
      });
    });

    return NextResponse.json(feria);
  } catch (error) {
    console.error("ERROR PUT FERIA:", error);
    return NextResponse.json(
      { error: "Error al actualizar feria" },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE – ELIMINAR FERIA (SEGURO)
=========================== */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    await prisma.$transaction(async (tx) => {
      await tx.evento_feria_fecha.deleteMany({
        where: { feria_id: id },
      });

      await tx.evento_feria_empresa.deleteMany({
        where: { feria_id: id },
      });

      await tx.evento_feria.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Feria eliminada" });
  } catch (error) {
    console.error("ERROR DELETE FERIA:", error);
    return NextResponse.json(
      { error: "Error al eliminar feria" },
      { status: 500 }
    );
  }
}
