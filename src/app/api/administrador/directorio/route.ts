import { NextResponse } from "next/server";
import { DirectorioController } from "@/controllers/directorioController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

/* =========================
   Utilidad fechas
========================= */
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/* =========================
   GET - LISTAR
========================= */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "directorio")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const miembros = await DirectorioController.obtenerDirectorio();
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
   POST - CREAR MIEMBRO
========================= */
export async function POST(req: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "directorio")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    const nuevoMiembro = await DirectorioController.crearMiembro({
      nombre,
      cargo,
      correo,
      telefono,
      periodoInicio: parseLocalDate(periodoInicio),
      periodoFin: periodoFin ? parseLocalDate(periodoFin) : null,
      fotoFile: foto,
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
