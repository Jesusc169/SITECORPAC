import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let nombre: string | undefined;
    let descripcion: string | undefined;
    let lugar: string | undefined;
    let fecha_hora: string | undefined;
    let imagen: string | null | undefined = undefined;

    /* =========================================
       SOPORTE TOTAL DE CONTENT-TYPE
    ========================================= */

    // 1️⃣ MULTIPART
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      nombre = formData.get("nombre") as string;
      descripcion = formData.get("descripcion") as string;
      lugar = formData.get("lugar") as string;
      fecha_hora = formData.get("fecha_hora") as string;

      const imagenFile = formData.get("imagen") as File | null;

      if (imagenFile && imagenFile.size > 0) {
        imagen = imagenFile.name; // mantiene tu lógica
      }
    }

    // 2️⃣ JSON
    else if (contentType.includes("application/json")) {
      const body = await req.json();

      nombre = body?.nombre;
      descripcion = body?.descripcion;
      lugar = body?.lugar;
      fecha_hora = body?.fecha_hora;
      imagen = body?.imagen ?? undefined;
    }

    // 3️⃣ FORM URL ENCODED
    else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const paramsData = new URLSearchParams(text);

      nombre = paramsData.get("nombre") || undefined;
      descripcion = paramsData.get("descripcion") || undefined;
      lugar = paramsData.get("lugar") || undefined;
      fecha_hora = paramsData.get("fecha_hora") || undefined;
      imagen = paramsData.get("imagen") || undefined;
    }

    // 4️⃣ SIN CONTENT-TYPE (fallback seguro)
    else {
      try {
        const body = await req.json();

        nombre = body?.nombre;
        descripcion = body?.descripcion;
        lugar = body?.lugar;
        fecha_hora = body?.fecha_hora;
        imagen = body?.imagen ?? undefined;
      } catch {
        return NextResponse.json(
          { error: "Content-Type no soportado" },
          { status: 415 }
        );
      }
    }

    /* =========================================
       VALIDACIONES
    ========================================= */

    if (!nombre || !fecha_hora) {
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    /* =========================================
       UPDATE (MISMA LÓGICA DE NEGOCIO)
    ========================================= */

    const actualizado = await prisma.sorteo.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        lugar,
        fecha_hora: new Date(fecha_hora),
        ...(imagen !== undefined && { imagen }),
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("ERROR UPDATE:", error);

    return NextResponse.json(
      { error: "Error actualizando sorteo" },
      { status: 500 }
    );
  }
}