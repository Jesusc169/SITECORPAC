import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarActividad, registrarError, type ModuloRegistro } from "@/lib/registro";
import { eliminarDefinitivamente, PapeleraError, restaurarDePapelera } from "@/lib/papelera";

export const runtime = "nodejs";

async function leerId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const QUE: Record<string, string> = {
  noticias: "la noticia",
  ferias: "la feria",
  sorteos: "el sorteo",
};

/* =====================================================
   POST → Restaurar (vuelve con su mismo id y sus fotos)
===================================================== */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const id = await leerId(params);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const fila = await restaurarDePapelera(id);
    await registrarActividad({
      usuario: usuarioActual,
      accion: "crear",
      modulo: fila.modulo as ModuloRegistro,
      entidadId: fila.entidadId,
      nivel: "aviso",
      detalle:
        fila.modulo === "directorio"
          ? `Restauró desde la papelera a ${fila.titulo} en el directorio`
          : `Restauró desde la papelera ${QUE[fila.modulo]} "${fila.titulo}"`,
      request,
    });
    return NextResponse.json({ ok: true, modulo: fila.modulo, entidadId: fila.entidadId });
  } catch (error) {
    if (error instanceof PapeleraError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    await registrarError("sistema", "Restaurar desde la papelera", error, request);
    return NextResponse.json({ error: "Error al restaurar" }, { status: 500 });
  }
}

/* =====================================================
   DELETE → Borrar definitivamente (no se puede deshacer)
===================================================== */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const id = await leerId(params);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { fila, archivosBorrados } = await eliminarDefinitivamente(id);
    await registrarActividad({
      usuario: usuarioActual,
      accion: "eliminar",
      modulo: fila.modulo as ModuloRegistro,
      entidadId: fila.entidadId,
      nivel: "aviso",
      detalle: `Borró definitivamente de la papelera "${fila.titulo}" (${archivosBorrados} archivo(s) eliminados del servidor)`,
      request,
    });
    return NextResponse.json({ ok: true, archivosBorrados });
  } catch (error) {
    if (error instanceof PapeleraError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    await registrarError("sistema", "Borrar definitivamente", error, request);
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
