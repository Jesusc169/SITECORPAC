import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

/* =========================
   Utilidad para fechas
   ========================= */
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/* =========================
   PUT - Editar miembro
   ========================= */
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await request.formData();

    const nombre = formData.get("nombre") as string | null;
    const cargo = formData.get("cargo") as string | null;
    const correo = formData.get("correo") as string | null;
    const telefono = formData.get("telefono") as string | null;
    const periodoInicio = formData.get("periodoInicio") as string | null;
    const periodoFin = formData.get("periodoFin") as string | null;
    const foto = formData.get("foto") as File | null;

    const miembro = await prisma.directorio.findUnique({
      where: { id },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    let fotoUrl = miembro.fotoUrl;

    /* =========================
       Manejo de foto
       ========================= */
    if (foto && foto.size > 0) {
      const buffer = Buffer.from(await foto.arrayBuffer());
      const extension = foto.name.split(".").pop();
      const fileName = `directorio-${Date.now()}.${extension}`;

      const uploadPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "directorio"
      );

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadPath, fileName), buffer);

      if (miembro.fotoUrl) {
        const oldPath = path.join(process.cwd(), "public", miembro.fotoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      fotoUrl = `/uploads/directorio/${fileName}`;
    }

    /* =========================
       Data dinámica
       ========================= */
    const data: Record<string, unknown> = {};

    if (nombre !== null) data.nombre = nombre;
    if (cargo !== null) data.cargo = cargo;
    if (correo !== null) data.correo = correo;
    if (telefono !== null) data.telefono = telefono;
    if (periodoInicio) data.periodoInicio = parseLocalDate(periodoInicio);
    if (periodoFin) data.periodoFin = parseLocalDate(periodoFin);
    if (fotoUrl !== miembro.fotoUrl) data.fotoUrl = fotoUrl;

    const actualizado = await prisma.directorio.update({
      where: { id },
      data,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json(
      { error: "Error al actualizar miembro" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE - Eliminar miembro
   ========================= */
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const miembro = await prisma.directorio.findUnique({
      where: { id },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    if (miembro.fotoUrl) {
      const filePath = path.join(process.cwd(), "public", miembro.fotoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.directorio.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    return NextResponse.json(
      { error: "Error al eliminar miembro" },
      { status: 500 }
    );
  }
}
