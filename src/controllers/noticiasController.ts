// src/controllers/noticiasController.ts
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { invalidarCache } from "@/lib/invalidarCache";
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
import { MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";
import { actualizarGaleria } from "@/lib/galeria";
import { moverAPapelera } from "@/lib/papelera";
import type { ActorRegistro } from "@/lib/registro";

export class NoticiaValidationError extends Error {}

interface DatosNoticia {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  imagenFiles: File[];
  imagenPrincipalIndex: number;
  pdfFiles: File[];
  activo: boolean;
}

interface DatosNoticiaActualizacion {
  titulo: string;
  descripcion: string;
  contenido: string | null;
  autor: string;
  activo: boolean;
  imagenesNuevas: File[];
  imagenesEliminar: number[];
  imagenPrincipalId: number | null;
  imagenPrincipalNuevaIndex: number | null;
  pdfFilesNuevos: File[];
  pdfsEliminar: number[];
}

// Lecturas públicas: cacheadas 60s y con el tag "noticias" para poder
// invalidarlas al instante desde crear/editar/eliminar (invalidarCache más
// abajo), en vez de forzar cada página a renderizar sin caché en cada visita.
// Los listados (home y /noticias) solo muestran tarjetas: no traemos
// `contenido` (TEXT largo) para no leerlo de la BD ni guardarlo en caché.
// Todas las lecturas públicas filtran `activo: true`: una noticia desactivada
// desde el panel desaparece del inicio, del listado, del detalle (404) y del
// sitemap, pero sigue en la BD y en el panel.
const CAMPOS_TARJETA = {
  id: true,
  titulo: true,
  descripcion: true,
  imagen: true,
  fecha: true,
} as const;

const obtenerNoticiasCacheadas = unstable_cache(
  async () =>
    prisma.noticia.findMany({ where: { activo: true }, orderBy: { fecha: "desc" }, select: CAMPOS_TARJETA }),
  ["noticias-todas"],
  { revalidate: 60, tags: ["noticias"] }
);

const obtenerUltimasNoticiasCacheadas = unstable_cache(
  async (limit: number) =>
    prisma.noticia.findMany({ where: { activo: true }, orderBy: { fecha: "desc" }, take: limit, select: CAMPOS_TARJETA }),
  ["noticias-ultimas"],
  { revalidate: 60, tags: ["noticias"] }
);

const obtenerNoticiaPorIdCacheada = unstable_cache(
  async (id: number) =>
    prisma.noticia.findFirst({
      where: { id, activo: true },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
        noticia_imagen: { orderBy: { orden: "asc" } },
      },
    }),
  ["noticia-detalle"],
  { revalidate: 60, tags: ["noticias"] }
);

const MAX_DOCUMENTOS = 5;

/** Documentos adjuntos que sí traen contenido, ya validados (tipo y tamaño). */
function documentosValidos(archivos: File[]): File[] {
  const validos = archivos.filter((f) => f && f.size > 0);
  for (const f of validos) {
    if (!esDocumentoPermitido(f)) {
      throw new NoticiaValidationError(
        `"${f.name}" no es un tipo de archivo permitido (PDF, Word o imagen JPG/PNG)`
      );
    }
    if (f.size > MAX_DOCUMENTO_BYTES) {
      throw new NoticiaValidationError(`"${f.name}" debe ser menor a 15MB`);
    }
  }
  return validos;
}

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

    if (input.pdfFiles.length > MAX_DOCUMENTOS) {
      throw new NoticiaValidationError(`Máximo ${MAX_DOCUMENTOS} documentos por noticia`);
    }
    const documentos = documentosValidos(input.pdfFiles);

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
    for (let i = 0; i < documentos.length; i++) {
      const url = await guardarDocumentoNoticia(documentos[i], i);
      pdfsData.push({ url, nombre: documentos[i].name, orden: i + 1 });
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
      activo: input.activo,
      pdfs: pdfsData,
      imagenes: imagenesData,
    });

    invalidarCache("noticias");
    return noticia;
  }

  // 🟠 Actualizar noticia (imagen, documentos y datos)
  static async actualizarNoticiaCompleta(id: number, input: DatosNoticiaActualizacion) {
    const noticiaActual = await NoticiaModel.obtenerPorId(id);
    if (!noticiaActual) return null;
    if (!input.titulo.trim()) {
      throw new NoticiaValidationError("El título es obligatorio");
    }

    // Primero se valida y recién después se borra o guarda: un PDF inválido ya no
    // deja la noticia modificada a medias.
    const documentosNuevos = documentosValidos(input.pdfFilesNuevos);
    const pdfsAEliminar = noticiaActual.noticia_pdf.filter((p) => input.pdfsEliminar.includes(p.id));
    const pdfsQueQuedan = noticiaActual.noticia_pdf.filter((p) => !input.pdfsEliminar.includes(p.id));
    if (pdfsQueQuedan.length + documentosNuevos.length > MAX_DOCUMENTOS) {
      throw new NoticiaValidationError(`Máximo ${MAX_DOCUMENTOS} documentos por noticia`);
    }

    const imagenPath = await actualizarGaleria(
      {
        existentes: noticiaActual.noticia_imagen,
        imagenesNuevas: input.imagenesNuevas,
        imagenesEliminar: input.imagenesEliminar,
        imagenPrincipalId: input.imagenPrincipalId,
        imagenPrincipalNuevaIndex: input.imagenPrincipalNuevaIndex,
      },
      {
        etiqueta: "noticia",
        error: (m) => new NoticiaValidationError(m),
        validarArchivo: (file) => {
          if (!esImagenValida(file)) throw new NoticiaValidationError("Solo se permiten imágenes");
          if (file.size > MAX_IMAGEN_BYTES) throw new NoticiaValidationError("Cada imagen debe ser menor a 10MB");
        },
        borrarArchivo: borrarImagenNoticia,
        guardarArchivo: guardarImagenNoticia,
        eliminarImagenes: NoticiaModel.eliminarImagenes,
        reordenarImagen: NoticiaModel.reordenarImagen,
        crearImagen: (url, orden) => NoticiaModel.crearImagen({ noticia_id: id, url, orden, principal: false }),
        marcarPrincipal: (idImagen) => NoticiaModel.marcarImagenPrincipal(id, idImagen),
      }
    );

    for (const pdf of pdfsAEliminar) {
      await borrarDocumentoNoticia(pdf.url);
    }
    if (pdfsAEliminar.length > 0) {
      await NoticiaModel.eliminarPdfs(pdfsAEliminar.map((p) => p.id));
    }

    // Los nuevos van al final, después del mayor orden de los que quedan
    let ordenSiguiente = Math.max(0, ...pdfsQueQuedan.map((p) => p.orden ?? 0)) + 1;
    for (const doc of documentosNuevos) {
      const url = await guardarDocumentoNoticia(doc, ordenSiguiente);
      await NoticiaModel.crearPdf({ noticia_id: id, url, nombre: doc.name, orden: ordenSiguiente });
      ordenSiguiente++;
    }

    const actualizada = await NoticiaModel.actualizar(id, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      contenido: input.contenido ? input.contenido : null,
      autor: input.autor,
      imagen: imagenPath,
      activo: input.activo,
      updatedAt: new Date(),
    });

    invalidarCache("noticias");
    return actualizada;
  }

  // 🔴 Eliminar noticia y sus archivos
  // Va a la papelera (30 días, se puede restaurar). Los archivos se borran
  // recién cuando vence; ver lib/papelera.ts.
  static async eliminarNoticiaCompleta(id: number, actor?: ActorRegistro | null) {
    const titulo = await moverAPapelera("noticias", id, actor);
    if (!titulo) return null;

    invalidarCache("noticias");
    return true;
  }
}
