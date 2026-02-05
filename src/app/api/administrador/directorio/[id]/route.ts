import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import { promises as fs } from "fs";

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
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const idStr = url.pathname.split("/").pop();
    const id = Number(idStr);

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

    const miembro = await prisma.directorio.findUnique({ where: { id } });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    let fotoUrl = miembro.fotoUrl;

    /* =========================
       MANEJO FOTO (OPTIMIZADO)
    ========================== */
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

      // crear carpeta si no existe (async)
      await fs.mkdir(uploadPath, { recursive: true });

      const newFilePath = path.join(uploadPath, fileName);

      // guardar imagen async (NO BLOQUEA VPS)
      await fs.writeFile(newFilePath, buffer);

      // borrar imagen anterior async
      if (miembro.fotoUrl) {
        try {
          const oldPath = path.join(process.cwd(), "public", miembro.fotoUrl);
          await fs.unlink(oldPath);
        } catch {
          // si no existe no pasa nada
        }
      }

      fotoUrl = `/uploads/directorio/${fileName}`;
    }

    /* =========================
       DATA DINÁMICA
    ========================== */
    const data: any = {};
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
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idStr = url.pathname.split("/").pop();
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const miembro = await prisma.directorio.findUnique({ where: { id } });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // borrar imagen async
    if (miembro.fotoUrl) {
      try {
        const filePath = path.join(process.cwd(), "public", miembro.fotoUrl);
        await fs.unlink(filePath);
      } catch {}
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
