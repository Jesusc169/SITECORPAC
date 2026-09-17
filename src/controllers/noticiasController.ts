// src/controllers/noticiasController.ts
import prisma from "@/lib/prisma";
import { unstable_cache, revalidateTag } from "next/cache";
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
import { resolverGaleria, MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";

export class NoticiaValidationError extends Error {}

interface DatosNoticia {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  imagenFiles: File[];
  imagenPrincipalIndex: number;
  pdfFiles: File[];
}

interface DatosNoticiaActualizacion {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  imagenesNuevas: File[];
  imagenesEliminar: number[];
  imagenPrincipalId: number | null;
  imagenPrincipalNuevaIndex: number | null;
  pdfFilesNuevos: File[];
  pdfsEliminar: number[];
}

// Lecturas públicas: cacheadas 60s y con el tag "noticias" para poder
// invalidarlas al instante desde crear/editar/eliminar (revalidateTag más
// abajo), en vez de forzar cada página a renderizar sin caché en cada visita.
const obtenerNoticiasCacheadas = unstable_cache(
  async () => prisma.noticia.findMany({ orderBy: { fecha: "desc" } }),
  ["noticias-todas"],
  { revalidate: 60, tags: ["noticias"] }
);

const obtenerUltimasNoticiasCacheadas = unstable_cache(
  async (limit: number) =>
    prisma.noticia.findMany({ orderBy: { fecha: "desc" }, take: limit }),
  ["noticias-ultimas"],
  { revalidate: 60, tags: ["noticias"] }
);

const obtenerNoticiaPorIdCacheada = unstable_cache(
  async (id: number) =>
    prisma.noticia.findUnique({
      where: { id },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
        noticia_imagen: { orderBy: { orden: "asc" } },
      },
    }),
  ["noticia-detalle"],
  { revalidate: 60, tags: ["noticias"] }
);

export class NoticiasController {
  // 🟢 Obtener todas las noticias (lectura pública, cacheada)
  static async obtenerNoticias() {
    return obtenerNoticiasCacheadas();
  }

  // 🔵 Obtener últimas noticias (lectura pública, cacheada)
  static async obtenerUltimasNoticias(limit = 3) {
    return obtenerUltimasNoticiasCacheadas(limit);
  }

  // 🟣 Obtener noticia por ID (lectura pública, cacheada)
  static async obtenerNoticiaPorId(id: number) {
    return obtenerNoticiaPorIdCacheada(id);
  }

  // 🟤 Listar noticias para el panel admin (incluye documentos, sin caché)
  static async obtenerNoticiasAdmin() {
    return NoticiaModel.obtenerTodas();
  }

  // 🟡 Crear noticia con hasta 5 fotos (una principal) y documentos adjuntos
  static async crearNoticiaCompleta(input: DatosNoticia) {
    const titulo = input.titulo.trim();
    if (!titulo) {
      throw new NoticiaValidationError("El título es obligatorio");
    }

    if (input.pdfFiles.length > 5) {
      throw new NoticiaValidationError("Máximo 5 documentos por noticia");
    }

    const imagenFilesValidos = input.imagenFiles.filter((f) => f && f.size > 0);
    if (imagenFilesValidos.length > MAX_IMAGENES_GALERIA) {
      throw new NoticiaValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por noticia`);
    }

    const principalIndex = Math.min(
      Math.max(0, input.imagenPrincipalIndex || 0),
      Math.max(0, imagenFilesValidos.length - 1)
    );

    const imagenesData: { url: string; orden: number; principal: boolean }[] = [];
    for (let i = 0; i < imagenFilesValidos.length; i++) {
      const file = imagenFilesValidos[i];
      if (!esImagenValida(file)) {
        throw new NoticiaValidationError("Solo se permiten imágenes");
      }
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new NoticiaValidationError("Cada imagen debe ser menor a 10MB");
      }
      const url = await guardarImagenNoticia(file, i);
      imagenesData.push({ url, orden: i + 1, principal: i === principalIndex });
    }

    const imagenPath = imagenesData[principalIndex]?.url ?? null;

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
    const noticia = await NoticiaModel.crear({
      titulo,
      descripcion: input.descripcion,
      contenido: input.contenido,
      autor: input.autor,
      imagen: imagenPath,
      fecha: now,
      updatedAt: now,
      pdfs: pdfsData,
      imagenes: imagenesData,
    });

    revalidateTag("noticias", "max");
    return noticia;
  }

  // 🟠 Actualizar noticia (imagen, documentos y datos)
  static async actualizarNoticiaCompleta(id: number, input: DatosNoticiaActualizacion) {
    const noticiaActual = await NoticiaModel.obtenerPorId(id);
    if (!noticiaActual) return null;

    const imagenesNuevasValidas = input.imagenesNuevas.filter((f) => f && f.size > 0);
    const existentes = noticiaActual.noticia_imagen.map((img) => ({ id: img.id, orden: img.orden }));
    const idsEliminar = input.imagenesEliminar.filter((eid) => existentes.some((e) => e.id === eid));

    const activasActuales = existentes.length - idsEliminar.length;
    if (activasActuales + imagenesNuevasValidas.length > MAX_IMAGENES_GALERIA) {
      throw new NoticiaValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por noticia`);
    }

    for (const file of imagenesNuevasValidas) {
      if (!esImagenValida(file)) {
        throw new NoticiaValidationError("Solo se permiten imágenes");
      }
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new NoticiaValidationError("Cada imagen debe ser menor a 10MB");
      }
    }

    const plan = resolverGaleria({
      existentes,
      idsEliminar,
      cantidadNuevas: imagenesNuevasValidas.length,
      principalExistenteId: input.imagenPrincipalId,
      principalNuevaIndex: input.imagenPrincipalNuevaIndex,
    });

    for (const eid of idsEliminar) {
      const img = noticiaActual.noticia_imagen.find((i) => i.id === eid);
      if (img) await borrarImagenNoticia(img.url);
    }
    if (idsEliminar.length > 0) {
      await NoticiaModel.eliminarImagenes(idsEliminar);
    }

    for (const sup of plan.supervivientes) {
      const original = existentes.find((e) => e.id === sup.id);
      if (original && original.orden !== sup.orden) {
        await NoticiaModel.reordenarImagen(sup.id, sup.orden);
      }
    }

    const nuevasCreadas: { id: number; url: string }[] = [];
    for (let i = 0; i < imagenesNuevasValidas.length; i++) {
      const file = imagenesNuevasValidas[i];
      const url = await guardarImagenNoticia(file, i);
      const creada = await NoticiaModel.crearImagen({
        noticia_id: id,
        url,
        orden: plan.nuevas[i].orden,
        principal: false,
      });
      nuevasCreadas.push({ id: creada.id, url });
    }

    const principal = plan.principal;
    let imagenPath: string | null = null;
    if (principal?.tipo === "existente") {
      await NoticiaModel.marcarImagenPrincipal(id, principal.id);
      imagenPath = noticiaActual.noticia_imagen.find((i) => i.id === principal.id)?.url ?? null;
    } else if (principal?.tipo === "nueva") {
      const fila = nuevasCreadas[principal.indice];
      if (fila) {
        await NoticiaModel.marcarImagenPrincipal(id, fila.id);
        imagenPath = fila.url;
      }
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

    const actualizada = await NoticiaModel.actualizar(id, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      contenido: input.contenido || null,
      autor: input.autor,
      imagen: imagenPath,
      updatedAt: new Date(),
    });

    revalidateTag("noticias", "max");
    return actualizada;
  }

  // 🔴 Eliminar noticia y sus archivos
  static async eliminarNoticiaCompleta(id: number) {
    const noticia = await NoticiaModel.obtenerPorId(id);
    if (!noticia) return null;

    await borrarImagenNoticia(noticia.imagen);
    for (const img of noticia.noticia_imagen) {
      await borrarImagenNoticia(img.url);
    }
    for (const pdf of noticia.noticia_pdf) {
      await borrarDocumentoNoticia(pdf.url);
    }

    await NoticiaModel.eliminar(id);
    revalidateTag("noticias", "max");
    return true;
  }
}
