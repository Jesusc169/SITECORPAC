import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET() {
  try {
    const ferias = await prisma.evento_feria.findMany({
      orderBy: { created_at: "desc" },
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
   POST – CREAR FERIA FULL
========================= */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const titulo = formData.get("titulo")?.toString().trim();
    const descripcion = formData.get("descripcion")?.toString().trim();
    const anioRaw = formData.get("anio");
    const imagenFile = formData.get("imagen_portada") as File | null;

    const empresas = JSON.parse(
      (formData.get("empresas") as string) || "[]"
    );
    const fechas = JSON.parse(
      (formData.get("fechas") as string) || "[]"
    );

    const anio = Number(anioRaw);

    /* =========================
       VALIDACIONES
    ========================= */
    if (!titulo || !descripcion || !anio) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    /* =========================
       GUARDAR IMAGEN REAL
    ========================= */
    let imagePath: string | null = null;

    if (imagenFile && imagenFile.size > 0) {
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 🔥 nombre limpio sin espacios
      const cleanName = imagenFile.name.replace(/\s+/g, "_");
      const fileName = `${Date.now()}-${cleanName}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "ferias"
      );

      // 🔥 crea carpeta si no existe
      await mkdir(uploadDir, { recursive: true });

      const fullPath = path.join(uploadDir, fileName);
      await writeFile(fullPath, buffer);

      // 🔥 ruta pública que usará el frontend
      imagePath = `/uploads/ferias/${fileName}`;
    }

    /* =========================
       CREAR FERIA + RELACIONES
    ========================= */
    const feria = await prisma.evento_feria.create({
      data: {
        titulo,
        descripcion,
        anio,
        imagen_portada: imagePath,

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

      include: {
        evento_feria_fecha: true,
        evento_feria_empresa: {
          include: { empresa: true },
        },
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