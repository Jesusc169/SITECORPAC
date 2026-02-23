import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

/* =========================================
GET - LISTAR
========================================= */
export async function GET() {
  try {
    const sorteos = await prisma.sorteo.findMany({
      orderBy: { fecha_hora: "desc" },
      include: {
        sorteo_producto: true,
      },
    });

    return NextResponse.json(sorteos);
  } catch (error) {
    console.error("ERROR GET:", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteos" },
      { status: 500 }
    );
  }
}

/* =========================================
POST - CREAR
========================================= */
export async function POST(req: Request) {
  try {
    let data: any = {};
    let imagenUrl: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    /* =====================================
       SI ES MULTIPART (VIENE IMAGEN)
    ===================================== */
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      data.nombre =
        formData.get("nombre") ??
        formData.get("titulo") ??
        "";

      data.descripcion = formData.get("descripcion") ?? "";
      data.lugar = formData.get("lugar") ?? "";

      const anioValue = formData.get("anio");
      data.anio = anioValue
        ? Number(anioValue)
        : new Date().getFullYear();

      data.estado = formData.get("estado") ?? "ACTIVO";

      const fechaValue = formData.get("fecha_hora");
      data.fecha_hora = fechaValue
        ? new Date(fechaValue as string)
        : new Date();

      const premiosRaw = formData.get("premios");
      data.premios = premiosRaw
        ? JSON.parse(premiosRaw as string)
        : [];

      const file = formData.get("imagen") as File;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

        const uploadDir = path.join(
          process.cwd(),
          "public/uploads/sorteos"
        );

        // Crear carpeta si no existe
        await mkdir(uploadDir, { recursive: true });

        const uploadPath = path.join(uploadDir, fileName);

        await writeFile(uploadPath, buffer);

        imagenUrl = `/uploads/sorteos/${fileName}`;
      }
    }

    /* =====================================
       SI ES JSON
    ===================================== */
    else {
      const json = await req.json();

      data.nombre = json.nombre ?? json.titulo ?? "";
      data.descripcion = json.descripcion ?? "";
      data.lugar = json.lugar ?? "";

      data.anio = json.anio
        ? Number(json.anio)
        : new Date().getFullYear();

      data.estado = json.estado ?? "ACTIVO";

      data.fecha_hora = json.fecha_hora
        ? new Date(json.fecha_hora)
        : new Date();

      data.premios = json.premios ?? [];
      data.imagen = json.imagen ?? null;
    }

    /* =====================================
       VALIDAR FECHA
    ===================================== */
    if (isNaN(data.fecha_hora.getTime())) {
      data.fecha_hora = new Date();
    }

    /* =====================================
       CREAR EN BASE DE DATOS
    ===================================== */
    const nuevo = await prisma.sorteo.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        lugar: data.lugar,
        anio: Number(data.anio),
        estado: data.estado,
        fecha_hora: data.fecha_hora,
        imagen: imagenUrl ?? data.imagen ?? null,
        sorteo_producto: {
          create:
            data.premios?.map((p: any) => ({
              nombre: p.nombre ?? "",
              descripcion: p.descripcion ?? "",
              cantidad: Number(p.cantidad) || 1,
            })) ?? [],
        },
      },
      include: {
        sorteo_producto: true,
      },
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    console.error("ERROR CREAR:", error);
    return NextResponse.json(
      { error: "Error creando sorteo" },
      { status: 500 }
    );
  }
}