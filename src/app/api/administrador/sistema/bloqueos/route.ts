import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarActividad, registrarError } from "@/lib/registro";
import { SistemaController, SistemaValidationError } from "@/controllers/sistemaController";

export const runtime = "nodejs";

/* =====================================================
   DELETE → Desbloquear una IP (solo administrador)
   Body: { ip: "1.2.3.4" }
   Borra sus intentos fallidos: puede volver a iniciar sesión al instante.
===================================================== */
export async function DELETE(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || usuarioActual.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ip = typeof body?.ip === "string" ? body.ip : "";
    const borrados = await SistemaController.desbloquearIp(ip);

    if (borrados === 0) {
      return NextResponse.json({ error: "Esa IP no tiene intentos registrados" }, { status: 404 });
    }

    await registrarActividad({
      usuario: usuarioActual,
      accion: "desbloquear_ip",
      modulo: "sesion",
      nivel: "aviso",
      detalle: `Desbloqueó la IP ${ip.trim()}`,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SistemaValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await registrarError("sistema", "Desbloquear IP", error, request);
    return NextResponse.json({ error: "Error al desbloquear la IP" }, { status: 500 });
  }
}
