import { NextResponse } from "next/server";
import { SorteoController, SorteoValidationError, type DatosSorteo, type Premio } from "@/controllers/sorteoController";
import { campoTexto, campoLista } from "@/lib/formulario";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { registrarActividad, registrarError, idDe, textoVisible } from "@/lib/registro";

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
    await registrarError("sorteos", "Listar sorteos", error);
    return NextResponse.json(
      { error: "Error obteniendo sorteos" },
      { status: 500 }
    );
  }
}

/* =========================================
POST - CREAR (multipart con fotos, o JSON con una URL de imagen)
========================================= */
const anioActual = () => new Date().getFullYear();
const estadoDe = (v: unknown): "ACTIVO" | "INACTIVO" => (v === "INACTIVO" ? "INACTIVO" : "ACTIVO");

async function leerFormulario(req: Request): Promise<DatosSorteo> {
  const fd = await req.formData();
  const anio = campoTexto(fd, "anio");
  const fecha = campoTexto(fd, "fecha_hora");
  const indice = campoTexto(fd, "imagenPrincipalIndex");
  return {
    // "titulo" se acepta por compatibilidad con un formulario antiguo
    nombre: campoTexto(fd, "nombre") || campoTexto(fd, "titulo"),
    descripcion: campoTexto(fd, "descripcion"),
    lugar: campoTexto(fd, "lugar"),
    anio: anio ? Number(anio) : anioActual(),
    estado: estadoDe(campoTexto(fd, "estado")),
    fecha_hora: fecha ? new Date(fecha) : new Date(),
    premios: campoLista<Premio>(fd, "premios"),
    imagenFiles: fd.getAll("imagenes") as File[],
    imagenPrincipalIndex: indice ? Number(indice) : 0,
    imagenUrl: null,
  };
}

async function leerJson(req: Request): Promise<DatosSorteo> {
  const json = await req.json();
  return {
    nombre: json.nombre ?? json.titulo ?? "",
    descripcion: json.descripcion ?? "",
    lugar: json.lugar ?? "",
    anio: json.anio ? Number(json.anio) : anioActual(),
    estado: estadoDe(json.estado),
    fecha_hora: json.fecha_hora ? new Date(json.fecha_hora) : new Date(),
    premios: json.premios ?? [],
    imagenFiles: [],
    imagenPrincipalIndex: 0,
    imagenUrl: json.imagen ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "sorteos")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const esMultipart = (req.headers.get("content-type") ?? "").includes("multipart/form-data");
    const datos = esMultipart ? await leerFormulario(req) : await leerJson(req);
    const nuevo = await SorteoController.crearSorteo(datos);

    await registrarActividad({
      usuario: usuarioActual,
      accion: "crear",
      modulo: "sorteos",
      entidadId: idDe(nuevo),
      detalle: `Creó el sorteo "${datos.nombre}" (${textoVisible(datos.estado !== "INACTIVO")})`,
      request: req,
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    if (error instanceof ArchivoInvalidoError || error instanceof SorteoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("sorteos", "Crear sorteo", error, req);
    return NextResponse.json(
      { error: "Error creando sorteo" },
      { status: 500 }
    );
  }
}
