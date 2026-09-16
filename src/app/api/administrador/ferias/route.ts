import { NextResponse } from "next/server";
import { FeriaController, FeriaValidationError } from "@/controllers/feriaController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ferias = await FeriaController.obtenerFeriasAdmin();
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
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();

    const feria = await FeriaController.crearFeria({
      titulo: formData.get("titulo")?.toString(),
      descripcion: formData.get("descripcion")?.toString(),
      anio: Number(formData.get("anio")),
      imagenFile: formData.get("imagen_portada") as File | null,
      empresas: JSON.parse((formData.get("empresas") as string) || "[]"),
      fechas: JSON.parse((formData.get("fechas") as string) || "[]"),
    });

    return NextResponse.json(feria, { status: 201 });
  } catch (error) {
    if (error instanceof FeriaValidationError || error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("POST FERIA ERROR:", error);
    return NextResponse.json(
      { error: "Error al crear feria" },
      { status: 500 }
    );
  }
}
