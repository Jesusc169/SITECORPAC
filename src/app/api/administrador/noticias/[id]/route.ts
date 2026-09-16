import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export const runtime = "nodejs";

const TIPOS_DOCUMENTO_PERMITIDOS = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const EXTENSIONES_DOCUMENTO_PERMITIDAS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

function esDocumentoPermitido(file: File) {
  const nombre = file.name.toLowerCase();
  const extensionValida = EXTENSIONES_DOCUMENTO_PERMITIDAS.some((ext) =>
    nombre.endsWith(ext)
  );
  return TIPOS_DOCUMENTO_PERMITIDOS.has(file.type) || extensionValida;
}

/* =====================================================
   PUT → Actualizar noticia
===================================================== */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const contenido = formData.get("contenido") as string;
    const autor = formData.get("autor") as string;
    const imagenFile = formData.get("imagen") as File | null;
    const pdfFilesNuevos = formData.getAll("pdfs") as File[];
    const pdfsEliminarRaw = formData.get("pdfsEliminar")?.toString() || "[]";

    let pdfsEliminar: number[] = [];
    try {
      pdfsEliminar = JSON.parse(pdfsEliminarRaw);
    } catch {
      pdfsEliminar = [];
    }

    const noticiaActual = await prisma.noticia.findUnique({
      where: { id },
      include: { noticia_pdf: true },
    });

    if (!noticiaActual) {
      return NextResponse.json(
        { message: "Noticia no encontrada" },
        { status: 404 }
      );
    }

    let imagenPath = noticiaActual.imagen;

    if (imagenFile && imagenFile.size > 0) {

      if (!imagenFile.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "Solo se permiten imágenes" },
          { status: 400 }
        );
      }

      if (imagenFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Máximo 10MB" },
          { status: 400 }
        );
      }

      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo =
        `noticia-${Date.now()}-${imagenFile.name.replace(/\s+/g, "_")}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "noticias"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);
      await writeFile(filePath, buffer);

      if (noticiaActual.imagen) {
        const rutaAnterior = path.join(
          process.cwd(),
          "public",
          noticiaActual.imagen
        );

        try {
          await unlink(rutaAnterior);
        } catch {}
      }

      imagenPath = `/uploads/noticias/${nombreArchivo}`;
    }

    /* =============================
       Eliminar PDFs marcados
    ============================== */
    const pdfsAEliminar = noticiaActual.noticia_pdf.filter((p) =>
      pdfsEliminar.includes(p.id)
    );

    const pdfsRestantes =
      noticiaActual.noticia_pdf.length - pdfsAEliminar.length;

    if (pdfsRestantes + pdfFilesNuevos.length > 5) {
      return NextResponse.json(
        { message: "Máximo 5 documentos por noticia" },
        { status: 400 }
      );
    }

    for (const pdf of pdfsAEliminar) {
      const rutaAnterior = path.join(process.cwd(), "public", pdf.url);
      try {
        await unlink(rutaAnterior);
      } catch {}
    }

    if (pdfsAEliminar.length > 0) {
      await prisma.noticia_pdf.deleteMany({
        where: { id: { in: pdfsAEliminar.map((p) => p.id) } },
      });
    }

    /* =============================
       Agregar PDFs nuevos
    ============================== */
    let ordenSiguiente =
      Math.max(
        0,
        ...noticiaActual.noticia_pdf
          .filter((p) => !pdfsEliminar.includes(p.id))
          .map((p) => p.orden ?? 0)
      ) + 1;

    for (const pdfFile of pdfFilesNuevos) {
      if (!pdfFile || pdfFile.size === 0) continue;

      if (!esDocumentoPermitido(pdfFile)) {
        return NextResponse.json(
          {
            message: `"${pdfFile.name}" no es un tipo de archivo permitido (PDF, Word o imagen JPG/PNG)`,
          },
          { status: 400 }
        );
      }

      if (pdfFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { message: `"${pdfFile.name}" debe ser menor a 15MB` },
          { status: 400 }
        );
      }

      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo =
        `noticia-${Date.now()}-${ordenSiguiente}-${pdfFile.name.replace(/\s+/g, "_")}`;

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

      await prisma.noticia_pdf.create({
        data: {
          noticia_id: id,
          url: `/uploads/noticias/pdf/${nombreArchivo}`,
          nombre: pdfFile.name,
          orden: ordenSiguiente,
        },
      });

      ordenSiguiente++;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        contenido: contenido || null,
        autor,
        imagen: imagenPath,
        updatedAt: new Date(),
      },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
      },
    });

    return NextResponse.json(noticiaActualizada);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar noticia" },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE → Eliminar noticia
===================================================== */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "noticias")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const noticia = await prisma.noticia.findUnique({
      where: { id },
      include: { noticia_pdf: true },
    });

    if (!noticia) {
      return NextResponse.json(
        { message: "Noticia no encontrada" },
        { status: 404 }
      );
    }

    if (noticia.imagen) {
      const rutaImagen = path.join(
        process.cwd(),
        "public",
        noticia.imagen
      );

      try {
        await unlink(rutaImagen);
      } catch {}
    }

    for (const pdf of noticia.noticia_pdf) {
      const rutaPdf = path.join(process.cwd(), "public", pdf.url);

      try {
        await unlink(rutaPdf);
      } catch {}
    }

    await prisma.noticia.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Noticia eliminada correctamente",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar noticia" },
      { status: 500 }
    );
  }
}