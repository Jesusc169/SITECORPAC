import { NextResponse } from "next/server";
import { SorteoController } from "@/controllers/sorteoController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

/* =========================================
GET - LISTAR
========================================= */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sorteos = await SorteoController.obtenerSorteosAdmin();
    return NextResponse.json(sorteos);
  } catch (error) {
    console.error("ERROR GET:", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteos" },
      { status: 500 }
    );
  }
}

/* =========================================
POST - CREAR
========================================= */
export async function POST(req: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let nombre = "";
    let descripcion = "";
    let lugar = "";
    let anio = new Date().getFullYear();
    let estado = "ACTIVO";
    let fecha_hora = new Date();
    let premios: any[] = [];
    let imagenFile: File | null = null;
    let imagenUrl: string | null = null;

    /* =====================================
       SI ES MULTIPART (VIENE IMAGEN)
    ===================================== */
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      nombre = (formData.get("nombre") ?? formData.get("titulo") ?? "").toString();
      descripcion = (formData.get("descripcion") ?? "").toString();
      lugar = (formData.get("lugar") ?? "").toString();

      const anioValue = formData.get("anio");
      anio = anioValue ? Number(anioValue) : new Date().getFullYear();

      estado = (formData.get("estado") ?? "ACTIVO").toString();

      const fechaValue = formData.get("fecha_hora");
      fecha_hora = fechaValue ? new Date(fechaValue as string) : new Date();

      const premiosRaw = formData.get("premios");
      premios = premiosRaw ? JSON.parse(premiosRaw as string) : [];

      imagenFile = formData.get("imagen") as File | null;
    }

    /* =====================================
       SI ES JSON
    ===================================== */
    else {
      const json = await req.json();

      nombre = json.nombre ?? json.titulo ?? "";
      descripcion = json.descripcion ?? "";
      lugar = json.lugar ?? "";
      anio = json.anio ? Number(json.anio) : new Date().getFullYear();
      estado = json.estado ?? "ACTIVO";
      fecha_hora = json.fecha_hora ? new Date(json.fecha_hora) : new Date();
      premios = json.premios ?? [];
      imagenUrl = json.imagen ?? null;
    }

    const nuevo = await SorteoController.crearSorteo({
      nombre,
      descripcion,
      lugar,
      anio,
      estado: estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
      fecha_hora,
      premios,
      imagenFile,
      imagenUrl,
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ERROR CREAR:", error);
    return NextResponse.json(
      { error: "Error creando sorteo" },
      { status: 500 }
    );
  }
}
