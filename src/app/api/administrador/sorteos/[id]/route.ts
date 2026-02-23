import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* =========================================================
   GET → Obtener sorteo por ID
========================================================= */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sorteo = await prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: { sorteo_producto: true },
    });

    if (!sorteo) {
      return NextResponse.json(
        { error: "Sorteo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(sorteo);
  } catch (error) {
    console.error("ERROR GET:", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT → Editar sorteo
========================================================= */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await request.formData();

    const nombre = formData.get("nombre")?.toString().trim() || "";
    const descripcion = formData.get("descripcion")?.toString().trim() || "";
    const lugar = formData.get("lugar")?.toString().trim() || "";
    const fecha_hora = formData.get("fecha_hora")?.toString().trim() || "";

    let anio = Number(formData.get("anio"));
    const estado =
      formData.get("estado")?.toString() === "INACTIVO"
        ? "INACTIVO"
        : "ACTIVO";

    const premiosRaw = formData.get("premios")?.toString() || "[]";

    let premios: any[] = [];
    try {
      premios = JSON.parse(premiosRaw);
    } catch {
      premios = [];
    }

    if (!nombre || !descripcion || !lugar || !fecha_hora) {
      return NextResponse.json(
        { error: "Campos obligatorios incompletos" },
        { status: 400 }
      );
    }

    if (!anio || isNaN(anio)) {
      anio = new Date(fecha_hora).getFullYear();
    }

    let imagenPath: string | undefined;
    const file = formData.get("imagen") as File | null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/sorteos"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      imagenPath = `/uploads/sorteos/${fileName}`;
    }

    const actualizado = await prisma.sorteo.update({
      where: { id: sorteoId },
      data: {
        nombre,
        descripcion,
        ...(imagenPath && { imagen: imagenPath }),
        lugar,
        fecha_hora: new Date(fecha_hora),
        anio,
        estado,
        sorteo_producto: {
          deleteMany: {},
          create: premios.map((p: any) => ({
            nombre: p.nombre || "",
            descripcion: p.descripcion || "",
            cantidad: Number(p.cantidad || 1),
          })),
        },
      },
      include: { sorteo_producto: true },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("ERROR PUT:", error);
    return NextResponse.json(
      { error: "Error actualizando sorteo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE → Eliminar sorteo
========================================================= */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sorteoId = Number(params.id);

    if (!sorteoId || isNaN(sorteoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.sorteo.delete({
      where: { id: sorteoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE:", error);
    return NextResponse.json(
      { error: "Error eliminando sorteo" },
      { status: 500 }
    );
  }
}