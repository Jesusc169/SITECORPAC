import { NextResponse } from "next/server";
import { DirectorioController } from "@/controllers/directorioController";

// La caché ahora vive en DirectorioController.obtenerDirectorioPublico
// (compartida entre los procesos del cluster, no por proceso).
export async function GET() {
  try {
    const directorio = await DirectorioController.obtenerDirectorioPublico();
    return NextResponse.json(directorio);
  } catch (error) {
    console.error("Error al obtener directorio:", error);
    return NextResponse.json(
      { error: "Error al obtener directorio" },
      { status: 500 }
    );
  }
}
