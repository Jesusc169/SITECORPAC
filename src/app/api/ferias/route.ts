import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🔥 cache 60s (CLAVE para 1k usuarios)
export const revalidate = 60;

/* =========================
   GET – LISTAR FERIAS (OPTIMIZADO)
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const anio = searchParams.get("anio");

    const ferias = await prisma.evento_feria.findMany({
      where: {
        estado: true,
        ...(anio ? { anio: Number(anio) } : {}),
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        anio: true,
        imagen_portada: true,
        created_at: true,
      },
    });

    return NextResponse.json(ferias);
  } catch (error) {
    console.error("ERROR LISTAR FERIAS:", error);
    return NextResponse.json(
      { error: "Error al obtener ferias" },
      { status: 500 }
    );
  }
}

/* =========================
   POST – CREAR FERIA (SE QUEDA IGUAL)
========================= */
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const titulo = String(form.get("titulo") || "");
    const descripcion = String(form.get("descripcion") || "");
    const empresas = JSON.parse(String(form.get("empresas") || "[]"));
    const fechas = JSON.parse(String(form.get("fechas") || "[]"));
    const imagen = form.get("imagen") as File | null;

    if (!fechas.length) {
      return NextResponse.json(
        { error: "Debe ingresar al menos una fecha" },
        { status: 400 }
      );
    }

    const anio = new Date(fechas[0].fecha).getFullYear();

    let imagePath: string | null = null;

    if (imagen) {
      const buffer = Buffer.from(await imagen.arrayBuffer());
      const fileName = `${Date.now()}-${imagen.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/ferias");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      imagePath = `/uploads/ferias/${fileName}`;
    }

    const feria = await prisma.evento_feria.create({
      data: {
        titulo,
        descripcion,
        anio,
        imagen_portada: imagePath,
        estado: true,
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

    return NextResponse.json(feria, { status: 201 });
  } catch (error) {
    console.error("ERROR CREAR FERIA:", error);
    return NextResponse.json(
      { error: "Error creando feria" },
      { status: 500 }
    );
  }
}
