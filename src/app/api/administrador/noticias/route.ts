import { NextResponse } from "next/server";
import { NoticiasController, NoticiaValidationError } from "@/controllers/noticiasController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

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
    console.error("ERROR GET NOTICIAS:", error);
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

    const nuevaNoticia = await NoticiasController.crearNoticiaCompleta({
      titulo: formData.get("titulo")?.toString().trim() || "",
      descripcion: formData.get("descripcion")?.toString().trim() || "",
      contenido: formData.get("contenido")?.toString() || null,
      autor: formData.get("autor")?.toString().trim() || "SITECORPAC",
      imagenFile: formData.get("imagen") as File | null,
      pdfFiles: formData.getAll("pdfs") as File[],
    });

    return NextResponse.json(nuevaNoticia, { status: 201 });
  } catch (error) {
    if (error instanceof NoticiaValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("ERROR CREANDO NOTICIA:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
