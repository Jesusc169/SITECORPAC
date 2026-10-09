import { NextResponse } from "next/server";
import { SorteoController } from "@/controllers/sorteoController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, nombreEntidad, idDe } from "@/lib/registro";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const sorteoId = Number(id);

    if (!sorteoId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const nuevo = await SorteoController.duplicarSorteo(sorteoId);

    if (!nuevo) {
      return NextResponse.json(
        { error: "Sorteo no encontrado" },
        { status: 404 }
      );
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "duplicar",
      modulo: "sorteos",
      entidadId: idDe(nuevo),
      detalle: `Duplicó el sorteo "${(await nombreEntidad("sorteos", sorteoId)) ?? `#${sorteoId}`}"`,
      request: req,
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    await registrarError("sorteos", "Duplicar sorteo", error, req);
    return NextResponse.json(
      { error: "Error duplicando sorteo" },
      { status: 500 }
    );
  }
}
