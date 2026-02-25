import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// 🔥 cache 60s
export const revalidate = 60;

/* =====================================================
   FUNCION SEGURA PARA OBTENER AÑO DESDE FECHA
===================================================== */
function obtenerAnioSeguro(fechaTexto: string): number {
  if (!fechaTexto) return new Date().getFullYear();

  try {
    // formato ISO: 2026-01-15
    if (fechaTexto.includes("-") && fechaTexto.length >= 10) {
      const partes = fechaTexto.split("-");
      if (partes[0].length === 4) {
        return Number(partes[0]);
      }
    }

    // formato peruano: 15/01/2026
    if (fechaTexto.includes("/")) {
      const partes = fechaTexto.split("/");
      if (partes.length === 3) {
        return Number(partes[2]);
      }
    }

    // fallback JS
    const fecha = new Date(fechaTexto);
    if (!isNaN(fecha.getTime())) {
      return fecha.getFullYear();
    }

    return new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    const anioParam = searchParams.get("anio");

    // ✅ VALIDACIÓN SEGURA DEL AÑO
    let anioFiltro: number | null = null;

    if (anioParam && /^\d{4}$/.test(anioParam)) {
      anioFiltro = Number(anioParam);
    }

    const ferias = await prisma.evento_feria.findMany({
      where: {
        estado: true,
        ...(anioFiltro ? { anio: anioFiltro } : {}),
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
      include: {
        evento_feria_empresa: {
          include: {
            empresa: true,
          },
        },
        evento_feria_fecha: true,
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
   POST – CREAR FERIA
========================= */
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

    const anio = obtenerAnioSeguro(fechas[0].fecha);

    let imagePath: string | null = null;

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