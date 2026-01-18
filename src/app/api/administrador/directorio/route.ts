import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

/* =========================
   Utilidad para fechas (FIX TZ)
   ========================= */
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  // 12:00 evita el desfase de zona horaria
  return new Date(year, month - 1, day, 12, 0, 0);
}

/* =========================
   GET - Listar directorio
   ========================= */
export async function GET() {
  try {
    const miembros = await prisma.directorio.findMany({
      orderBy: { orden: "asc" }, // 🔥 backend manda el orden
    });

    return NextResponse.json(miembros);
  } catch (error) {
    console.error("Error al obtener directorio:", error);
    return NextResponse.json(
      { error: "Error al obtener directorio" },
      { status: 500 }
    );
  }
}

/* =========================
   POST - Crear miembro
   ========================= */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string;
    const cargo = formData.get("cargo") as string;
    const correo = formData.get("correo") as string;
    const telefono = formData.get("telefono") as string;
    const periodoInicio = formData.get("periodoInicio") as string;
    const periodoFin = formData.get("periodoFin") as string | null;
    const foto = formData.get("foto") as File | null;

    if (!nombre || !cargo || !correo || !periodoInicio) {
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    /* =========================
       Obtener último orden
       ========================= */
    const ultimo = await prisma.directorio.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });

    const nuevoOrden = ultimo ? ultimo.orden + 1 : 1;

    /* =========================
       Guardar foto (opcional)
       ========================= */
    let fotoUrl: string | null = null;

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
      fotoUrl = `/uploads/directorio/${fileName}`;
    }

    /* =========================
       Crear en BD
       ========================= */
    const nuevoMiembro = await prisma.directorio.create({
      data: {
        nombre,
        cargo,
        correo,
        telefono,
        fotoUrl,
        periodoInicio: parseLocalDate(periodoInicio),
        periodoFin: periodoFin ? parseLocalDate(periodoFin) : null,
        orden: nuevoOrden,
      },
    });

    return NextResponse.json(nuevoMiembro, { status: 201 });
  } catch (error) {
    console.error("Error al crear miembro:", error);
    return NextResponse.json(
      { error: "Error al crear miembro" },
      { status: 500 }
    );
  }
}
