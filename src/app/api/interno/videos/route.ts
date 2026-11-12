import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { invalidarCache } from "@/lib/invalidarCache";
import { claveInterna } from "@/lib/videos/procesador";

export const runtime = "nodejs";

/**
 * Lo llama el procesador de videos (lib/videos/procesador.ts) al terminar
 * de comprimir uno, para que el video aparezca al instante en el sitio:
 * revalidateTag solo funciona dentro de una ruta como esta.
 */
export async function POST(request: Request) {
  const recibida = Buffer.from(request.headers.get("x-clave-interna") ?? "");
  const esperada = Buffer.from(claveInterna());
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  for (const tag of ["noticias", "ferias", "sorteos"]) invalidarCache(tag);
  return NextResponse.json({ ok: true });
}
