// src/controllers/noticiasController.ts
import prisma from "@/lib/prisma";
import { NoticiaModel } from "@/models/noticiaModel";
import {
  esImagenValida,
  esDocumentoPermitido,
  guardarImagenNoticia,
  borrarImagenNoticia,
  guardarDocumentoNoticia,
  borrarDocumentoNoticia,
  MAX_IMAGEN_BYTES,
  MAX_DOCUMENTO_BYTES,
} from "@/lib/archivosNoticia";

export class NoticiaValidationError extends Error {}

interface DatosNoticia {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  imagenFile: File | null;
  pdfFiles: File[];
}

interface DatosNoticiaActualizacion {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  imagenFile: File | null;
  pdfFilesNuevos: File[];
  pdfsEliminar: number[];
}

export class NoticiasController {
  // 🟢 Obtener todas las noticias (lectura pública, sin cambios)
  static async obtenerNoticias() {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
    });
  }

  // 🔵 Obtener últimas noticias (lectura pública, sin cambios)
  static async obtenerUltimasNoticias(limit = 3) {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
      take: limit,
    });
  }

  // 🟣 Obtener noticia por ID (lectura pública, sin cambios)
  static async obtenerNoticiaPorId(id: number) {
    return await prisma.noticia.findUnique({
      where: { id },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
      },
    });
  }

  // 🟤 Listar noticias para el panel admin (incluye documentos)
  static async obtenerNoticiasAdmin() {
    return NoticiaModel.obtenerTodas();
  }

  // 🟡 Crear noticia con imagen y documentos adjuntos
  static async crearNoticiaCompleta(input: DatosNoticia) {
    const titulo = input.titulo.trim();
    if (!titulo) {
      throw new NoticiaValidationError("El título es obligatorio");
    }

    if (input.pdfFiles.length > 5) {
      throw new NoticiaValidationError("Máximo 5 documentos por noticia");
    }

    let imagenPath: string | null = null;
    if (input.imagenFile && input.imagenFile.size > 0) {
      if (!esImagenValida(input.imagenFile)) {
        throw new NoticiaValidationError("Solo se permiten imágenes");
      }
      if (input.imagenFile.size > MAX_IMAGEN_BYTES) {
        throw new NoticiaValidationError("La imagen debe ser menor a 10MB");
      }
      imagenPath = await guardarImagenNoticia(input.imagenFile);
    }

    const pdfsData: { url: string; nombre: string; orden: number }[] = [];
    for (let i = 0; i < input.pdfFiles.length; i++) {
      const pdfFile = input.pdfFiles[i];
      if (!pdfFile || pdfFile.size === 0) continue;

      if (!esDocumentoPermitido(pdfFile)) {
        throw new NoticiaValidationError(
          `"${pdfFile.name}" no es un tipo de archivo permitido (PDF, Word o imagen JPG/PNG)`
        );
      }
      if (pdfFile.size > MAX_DOCUMENTO_BYTES) {
        throw new NoticiaValidationError(`"${pdfFile.name}" debe ser menor a 15MB`);
      }

      const url = await guardarDocumentoNoticia(pdfFile, i);
      pdfsData.push({ url, nombre: pdfFile.name, orden: i + 1 });
    }

    const now = new Date();
    return NoticiaModel.crear({
      titulo,
      descripcion: input.descripcion,
      contenido: input.contenido,
      autor: input.autor,
      imagen: imagenPath,
      fecha: now,
      updatedAt: now,
      pdfs: pdfsData,
    });
  }

  // 🟠 Actualizar noticia (imagen, documentos y datos)
  static async actualizarNoticiaCompleta(id: number, input: DatosNoticiaActualizacion) {
    const noticiaActual = await NoticiaModel.obtenerPorId(id);
    if (!noticiaActual) return null;

    let imagenPath = noticiaActual.imagen;

    if (input.imagenFile && input.imagenFile.size > 0) {
      if (!esImagenValida(input.imagenFile)) {
        throw new NoticiaValidationError("Solo se permiten imágenes");
      }
      if (input.imagenFile.size > MAX_IMAGEN_BYTES) {
        throw new NoticiaValidationError("Máximo 10MB");
      }

      const nuevaUrl = await guardarImagenNoticia(input.imagenFile);
      await borrarImagenNoticia(noticiaActual.imagen);
      imagenPath = nuevaUrl;
    }

    const pdfsAEliminar = noticiaActual.noticia_pdf.filter((p) =>
      input.pdfsEliminar.includes(p.id)
    );
    const pdfsRestantes = noticiaActual.noticia_pdf.length - pdfsAEliminar.length;

    if (pdfsRestantes + input.pdfFilesNuevos.length > 5) {
      throw new NoticiaValidationError("Máximo 5 documentos por noticia");
    }

    for (const pdf of pdfsAEliminar) {
      await borrarDocumentoNoticia(pdf.url);
    }
    if (pdfsAEliminar.length > 0) {
      await NoticiaModel.eliminarPdfs(pdfsAEliminar.map((p) => p.id));
    }

    let ordenSiguiente =
      Math.max(
        0,
        ...noticiaActual.noticia_pdf
          .filter((p) => !input.pdfsEliminar.includes(p.id))
          .map((p) => p.orden ?? 0)
      ) + 1;

    for (const pdfFile of input.pdfFilesNuevos) {
      if (!pdfFile || pdfFile.size === 0) continue;

      if (!esDocumentoPermitido(pdfFile)) {
        throw new NoticiaValidationError(
          `"${pdfFile.name}" no es un tipo de archivo permitido (PDF, Word o imagen JPG/PNG)`
        );
      }
      if (pdfFile.size > MAX_DOCUMENTO_BYTES) {
        throw new NoticiaValidationError(`"${pdfFile.name}" debe ser menor a 15MB`);
      }

      const url = await guardarDocumentoNoticia(pdfFile, ordenSiguiente);
      await NoticiaModel.crearPdf({
        noticia_id: id,
        url,
        nombre: pdfFile.name,
        orden: ordenSiguiente,
      });
      ordenSiguiente++;
    }

    return NoticiaModel.actualizar(id, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      contenido: input.contenido || null,
      autor: input.autor,
      imagen: imagenPath,
      updatedAt: new Date(),
    });
  }

  // 🔴 Eliminar noticia y sus archivos
  static async eliminarNoticiaCompleta(id: number) {
    const noticia = await NoticiaModel.obtenerPorId(id);
    if (!noticia) return null;

    await borrarImagenNoticia(noticia.imagen);
    for (const pdf of noticia.noticia_pdf) {
      await borrarDocumentoNoticia(pdf.url);
    }

    await NoticiaModel.eliminar(id);
    return true;
  }
}
