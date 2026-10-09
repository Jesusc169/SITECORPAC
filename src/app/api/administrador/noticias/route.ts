import { NextResponse } from "next/server";
import { NoticiasController, NoticiaValidationError } from "@/controllers/noticiasController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { leerVisible } from "@/lib/visibilidad";
import { registrarActividad, registrarError, idDe, textoVisible } from "@/lib/registro";
import { campoTexto, campoTextoODefecto, campoOpcional } from "@/lib/formulario";

export const runtime = "nodejs";

/* =====================================
   GET → Listar noticias
===================================== */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const noticias = await NoticiasController.obtenerNoticiasAdmin();
    return NextResponse.json(noticias);
  } catch (error) {
    await registrarError("noticias", "Listar noticias", error);
    return NextResponse.json(
      { message: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}

/* =====================================
   POST → Crear noticia
===================================== */
export async function POST(request: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();

    const imagenPrincipalIndexRaw = formData.get("imagenPrincipalIndex");

    const nuevaNoticia = await NoticiasController.crearNoticiaCompleta({
      titulo: campoTexto(formData, "titulo"),
      descripcion: campoTexto(formData, "descripcion"),
      contenido: campoOpcional(formData, "contenido"),
      autor: campoTextoODefecto(formData, "autor", "SITECORPAC"),
      imagenFiles: formData.getAll("imagenes") as File[],
      imagenPrincipalIndex: imagenPrincipalIndexRaw ? Number(imagenPrincipalIndexRaw) : 0,
      pdfFiles: formData.getAll("pdfs") as File[],
      activo: leerVisible(formData),
    });

    await registrarActividad({
      usuario: usuarioActual,
      accion: "crear",
      modulo: "noticias",
      entidadId: idDe(nuevaNoticia),
      detalle: `Creó la noticia "${nuevaNoticia.titulo}" (${textoVisible(nuevaNoticia.activo)})`,
      request,
    });

    return NextResponse.json(nuevaNoticia, { status: 201 });
  } catch (error) {
    if (error instanceof NoticiaValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await registrarError("noticias", "Crear noticia", error, request);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
