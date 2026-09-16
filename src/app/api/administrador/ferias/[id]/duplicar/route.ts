import { NextResponse } from "next/server";
import { FeriaController } from "@/controllers/feriaController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const feriaId = Number(id);

    if (!feriaId) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const nuevaFeria = await FeriaController.duplicarFeria(feriaId);

    if (!nuevaFeria) {
      return NextResponse.json(
        { error: "Feria no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Feria duplicada correctamente",
      nuevaFeria,
    });
  } catch (error) {
    console.error("ERROR DUPLICAR:", error);
    return NextResponse.json(
      { error: "Error interno al duplicar feria" },
      { status: 500 }
    );
  }
}
