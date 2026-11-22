import { NextResponse } from "next/server";
import { FeriaController } from "@/controllers/feriaController";

// Sin `revalidate`: la respuesta depende del query (?anio, ?page), así que la
// ruta es dinámica. La caché de 60 s está en el controlador (unstable_cache).

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET(req: Request) {
  // Fuera del try: leer req.url marca la ruta como dinámica y Next lo señala
  // con un aviso interno que no debe atraparse (si no, sale un falso
  // "ERROR LISTAR FERIAS" al compilar).
  const { searchParams } = new URL(req.url);
  try {
    const ferias = await FeriaController.obtenerFeriasPublicas({
      anioParam: searchParams.get("anio"),
      pageParam: searchParams.get("page"),
    });

    return NextResponse.json(ferias);
  } catch (error) {
    console.error("ERROR LISTAR FERIAS:", error);
    return NextResponse.json(
      { error: "Error al obtener ferias" },
      { status: 500 }
    );
  }
}
