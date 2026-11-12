import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { registrarError } from "@/lib/registro";
import { SELECT_VIDEO } from "@/lib/videos/vincular";
import { puedeUsarVideos } from "@/lib/permisos";

export const runtime = "nodejs";

/* GET → estado del video (el formulario lo consulta mientras se comprime) */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || !puedeUsarVideos(usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const id = Number((await context.params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const video = await prisma.video.findUnique({ where: { id }, ...SELECT_VIDEO });
    if (!video) return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
    return NextResponse.json(video);
  } catch (error) {
    await registrarError("sistema", "Estado de un video", error);
    return NextResponse.json({ error: "Error consultando el video" }, { status: 500 });
  }
}
