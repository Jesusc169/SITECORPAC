import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { puedeUsarVideos } from "@/lib/permisos";
import { registrarError } from "@/lib/registro";
import { espacioVideos, VideoError } from "@/lib/videos/almacen";
import { recibirVideo } from "@/lib/videos/subida";

export const runtime = "nodejs";

/* GET → espacio usado y disponible para videos (lo muestra el formulario) */
export async function GET() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || !puedeUsarVideos(usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(await espacioVideos());
  } catch (error) {
    await registrarError("sistema", "Espacio de videos", error);
    return NextResponse.json({ error: "Error consultando el espacio" }, { status: 500 });
  }
}

/* POST → el cuerpo es el archivo; el nombre va en la cabecera X-Nombre-Archivo */
export async function POST(request: Request) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || !puedeUsarVideos(usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const video = await recibirVideo(request, usuario.id);
    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    if (error instanceof VideoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await registrarError("sistema", "Subir video", error, request);
    return NextResponse.json({ error: "No se pudo subir el video. Vuelve a intentarlo." }, { status: 500 });
  }
}
