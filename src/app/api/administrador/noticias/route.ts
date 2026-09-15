import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
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

    const noticias = await prisma.noticia.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
      },
    });

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

    const titulo = formData.get("titulo")?.toString().trim() || "";
    const descripcion = formData.get("descripcion")?.toString().trim() || "";
    const contenido = formData.get("contenido")?.toString() || null;
    const autor = formData.get("autor")?.toString().trim() || "SITECORPAC";
    const imagenFile = formData.get("imagen") as File | null;
    const pdfFiles = formData.getAll("pdfs") as File[];

    // Validación mínima (sin romper tu lógica)
    if (!titulo) {
      return NextResponse.json(
        { message: "El título es obligatorio" },
        { status: 400 }
      );
    }

    if (pdfFiles.length > 5) {
      return NextResponse.json(
        { message: "Máximo 5 documentos PDF por noticia" },
        { status: 400 }
      );
    }

    let imagenPath: string | null = null;

    /* =============================
       Guardar imagen si existe
    ============================== */
    if (imagenFile && imagenFile.size > 0) {
      // Validación tipo
      if (!imagenFile.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "Solo se permiten imágenes" },
          { status: 400 }
        );
      }

      // Validación tamaño (10MB)
      if (imagenFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { message: "La imagen debe ser menor a 10MB" },
          { status: 400 }
        );
      }

      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo = `noticia-${Date.now()}-${imagenFile.name.replace(
        /\s+/g,
        "_"
      )}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "noticias"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);
      await writeFile(filePath, buffer);

      imagenPath = `/uploads/noticias/${nombreArchivo}`;
    }

    /* =============================
       Guardar PDFs si existen (hasta 5)
    ============================== */
    const pdfsData: { url: string; nombre: string; orden: number }[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      const pdfFile = pdfFiles[i];
      if (!pdfFile || pdfFile.size === 0) continue;

      if (pdfFile.type !== "application/pdf") {
        return NextResponse.json(
          { message: "Los documentos adjuntos deben ser PDF" },
          { status: 400 }
        );
      }

      if (pdfFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { message: `El PDF "${pdfFile.name}" debe ser menor a 15MB` },
          { status: 400 }
        );
      }

      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo = `noticia-${Date.now()}-${i}-${pdfFile.name.replace(
        /\s+/g,
        "_"
      )}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "noticias",
        "pdf"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);
      await writeFile(filePath, buffer);

      pdfsData.push({
        url: `/uploads/noticias/pdf/${nombreArchivo}`,
        nombre: pdfFile.name,
        orden: i + 1,
      });
    }

    const now = new Date();

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        descripcion,
        contenido,
        autor,
        imagen: imagenPath,
        fecha: now,
        updatedAt: now,
        noticia_pdf: {
          create: pdfsData,
        },
      },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
      },
    });

    return NextResponse.json(nuevaNoticia, { status: 201 });

  } catch (error) {
    console.error("ERROR CREANDO NOTICIA:", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}