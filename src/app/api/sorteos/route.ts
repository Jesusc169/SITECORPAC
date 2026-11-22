import { NextResponse } from "next/server";
import { SorteoController } from "@/controllers/sorteoController";

// Sin `revalidate`: la respuesta depende del query (?anio), así que la ruta
// es dinámica. La caché de 60 s está en el controlador (unstable_cache).

export async function GET(req: Request) {
  // Fuera del try: leer req.url marca la ruta como dinámica; ese aviso
  // interno de Next no debe atraparse ni registrarse como error.
  const { searchParams } = new URL(req.url);
  try {
    const sorteos = await SorteoController.obtenerSorteosPublicos(searchParams.get("anio"));
    return NextResponse.json(sorteos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener sorteos" },
      { status: 500 }
    );
  }
}
