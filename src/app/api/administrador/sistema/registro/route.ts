import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarError } from "@/lib/registro";
import {
  SistemaController,
  SistemaValidationError,
  leerFiltros,
} from "@/controllers/sistemaController";

export const runtime = "nodejs";

/* =====================================================
   GET → Registro de actividad (solo administrador)
   ?desde=AAAA-MM-DD&hasta=…&modulo=…&nivel=…&usuario=…&q=…&pagina=N
   ?formato=csv → descarga (hasta 5000 filas, mismos filtros)
===================================================== */
export async function GET(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const filtros = leerFiltros(params);

    if (params.get("formato") === "csv") {
      const csv = await SistemaController.exportarRegistroCsv(filtros);
      const hoy = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="registro-sitecorpac-${hoy}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pagina = Number(params.get("pagina") ?? "1");
    const datos = await SistemaController.listarRegistro(filtros, pagina);
    return NextResponse.json(datos, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SistemaValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await registrarError("sistema", "Leer registro de actividad", error, request);
    return NextResponse.json({ error: "Error al leer el registro" }, { status: 500 });
  }
}
