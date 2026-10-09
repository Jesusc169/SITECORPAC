import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarActividad, registrarError, nombreONumero } from "@/lib/registro";
import { RegistroModel } from "@/models/registroModel";
import {
  diferencias,
  instantanea,
  restaurarCampos,
  tieneHistorial,
  type Instantanea,
} from "@/lib/historial";

export const runtime = "nodejs";

async function leerFila(params: Promise<{ id: string }>) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return RegistroModel.obtener(n);
}

/* =====================================================
   GET → Qué cambió en una edición (solo administrador)
===================================================== */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const fila = await leerFila(params);
    if (!fila?.antes) {
      return NextResponse.json({ error: "Ese movimiento no tiene historial de cambios" }, { status: 404 });
    }

    const antes = fila.antes as Instantanea;
    const despues = (fila.despues as Instantanea | null) ?? null;
    const cambios = diferencias(fila.modulo, antes, despues);
    const existe =
      tieneHistorial(fila.modulo) && fila.entidadId
        ? (await instantanea(fila.modulo, fila.entidadId)) !== null
        : false;

    return NextResponse.json({
      id: fila.id,
      fecha: fila.fecha.toISOString(),
      usuario: fila.usuario,
      modulo: fila.modulo,
      entidadId: fila.entidadId,
      detalle: fila.detalle,
      cambios,
      existe,
      puedeRestaurar: existe && cambios.some((c) => c.restaurable),
    });
  } catch (error) {
    await registrarError("sistema", "Ver historial de cambios", error, request);
    return NextResponse.json({ error: "Error al leer el historial" }, { status: 500 });
  }
}

/* =====================================================
   POST → Volver los textos a como estaban ANTES de esa edición
===================================================== */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const fila = await leerFila(params);
    if (!fila || !fila.antes || !fila.entidadId || !tieneHistorial(fila.modulo)) {
      return NextResponse.json({ error: "Ese movimiento no se puede restaurar" }, { status: 404 });
    }

    const modulo = fila.modulo;
    const id = fila.entidadId;
    const actual = await instantanea(modulo, id);
    if (!actual) {
      return NextResponse.json(
        { error: "Ese elemento ya no existe. Si fue eliminado, búscalo en la Papelera." },
        { status: 404 }
      );
    }

    await restaurarCampos(modulo, id, fila.antes as Instantanea);
    const despues = await instantanea(modulo, id);
    const fechaCambio = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      dateStyle: "short",
      timeStyle: "short",
    }).format(fila.fecha);

    const quien = fila.usuario ? " hecho por " + fila.usuario : "";
    await registrarActividad({
      usuario: usuarioActual,
      accion: "editar",
      modulo,
      entidadId: id,
      nivel: "aviso",
      detalle: `Restauró la versión anterior de "${nombreONumero((actual.titulo ?? actual.nombre) as string | null, id)}" (deshizo el cambio del ${fechaCambio}${quien})`,
      antes: actual,
      despues,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await registrarError("sistema", "Restaurar versión anterior", error, request);
    return NextResponse.json({ error: "Error al restaurar la versión" }, { status: 500 });
  }
}
