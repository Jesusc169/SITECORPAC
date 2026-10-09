import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarError } from "@/lib/registro";
import { depurarPapelera, listarPapelera } from "@/lib/papelera";

export const runtime = "nodejs";

/* =====================================================
   GET → Lo que está en la papelera (solo administrador)
   De paso vacía lo que ya cumplió 30 días.
===================================================== */
export async function GET(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await depurarPapelera();
    return NextResponse.json(await listarPapelera(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await registrarError("sistema", "Listar papelera", error, request);
    return NextResponse.json({ error: "Error al leer la papelera" }, { status: 500 });
  }
}
