import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* =========================
   GET – Listar ferias
   ========================= */
export async function GET() {
  try {
    const ferias = await prisma.evento_feria.findMany({
      orderBy: { anio: "desc" },
      include: {
        evento_feria_fecha: true,
        evento_feria_empresa: {
          include: { empresa: true },
        },
      },
    });

    return NextResponse.json(ferias);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al listar ferias" },
      { status: 500 }
    );
  }
}

/* =========================
   POST – Crear feria (FormData)
   ========================= */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const titulo = formData.get("titulo")?.toString().trim();
    const descripcion = formData.get("descripcion")?.toString().trim();
    const anioRaw = formData.get("anio");
    const imagenFile = formData.get("imagen_portada") as File | null;

    const anio = Number(anioRaw);

    /* =========================
       VALIDACIONES CORRECTAS
       ========================= */
    if (!titulo || !descripcion || isNaN(anio) || anio <= 0) {
      return NextResponse.json(
        { error: "Datos incompletos o inválidos" },
        { status: 400 }
      );
    }

    /* =========================
       MANEJO DE IMAGEN
       ========================= */
    let imagen_portada: string | null = null;

    if (imagenFile && imagenFile.size > 0) {
      imagen_portada = imagenFile.name;
    }

    /* =========================
       CREAR FERIA
       ========================= */
    const feria = await prisma.evento_feria.create({
      data: {
        titulo,
        descripcion,
        anio,
        imagen_portada,
      },
    });

    return NextResponse.json(feria, { status: 201 });
  } catch (error) {
    console.error("POST FERIA ERROR:", error);
    return NextResponse.json(
      { error: "Error al crear feria" },
      { status: 500 }
    );
  }
}
