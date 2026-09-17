import prisma from "@/lib/prisma";
import type { noticia } from "@prisma/client";

const CON_PDFS = {
  noticia_pdf: { orderBy: { orden: "asc" as const } },
  noticia_imagen: { orderBy: { orden: "asc" as const } },
};

export const NoticiaModel = {
  obtenerTodas: async () => {
    return prisma.noticia.findMany({
      orderBy: { createdAt: "desc" },
      include: CON_PDFS,
    });
  },

  obtenerPorId: async (id: number) => {
    return prisma.noticia.findUnique({
      where: { id },
      include: CON_PDFS,
    });
  },

  crear: async (data: {
    titulo: string;
    descripcion: string;
    contenido: string | null;
    autor: string;
    imagen: string | null;
    fecha: Date;
    updatedAt: Date;
    pdfs: { url: string; nombre: string; orden: number }[];
    imagenes: { url: string; orden: number; principal: boolean }[];
  }) => {
    const { pdfs, imagenes, ...resto } = data;
    return prisma.noticia.create({
      data: {
        ...resto,
        noticia_pdf: { create: pdfs },
        noticia_imagen: { create: imagenes },
      },
      include: CON_PDFS,
    });
  },

  actualizar: async (
    id: number,
    data: Partial<Pick<noticia, "titulo" | "descripcion" | "contenido" | "autor" | "imagen" | "updatedAt">>
  ) => {
    return prisma.noticia.update({
      where: { id },
      data,
      include: CON_PDFS,
    });
  },

  eliminar: async (id: number) => {
    return prisma.noticia.delete({ where: { id } });
  },

  crearPdf: async (data: { noticia_id: number; url: string; nombre: string; orden: number }) => {
    return prisma.noticia_pdf.create({ data });
  },

  eliminarPdfs: async (ids: number[]) => {
    return prisma.noticia_pdf.deleteMany({ where: { id: { in: ids } } });
  },

  crearImagen: async (data: { noticia_id: number; url: string; orden: number; principal: boolean }) => {
    return prisma.noticia_imagen.create({ data });
  },

  eliminarImagenes: async (ids: number[]) => {
    if (ids.length === 0) return;
    await prisma.noticia_imagen.deleteMany({ where: { id: { in: ids } } });
  },

  reordenarImagen: async (id: number, orden: number) => {
    await prisma.noticia_imagen.update({ where: { id }, data: { orden } });
  },

  marcarImagenPrincipal: async (noticia_id: number, id: number) => {
    await prisma.noticia_imagen.updateMany({
      where: { noticia_id },
      data: { principal: false },
    });
    await prisma.noticia_imagen.update({ where: { id }, data: { principal: true } });
  },

  contar: async () => {
    return prisma.noticia.count();
  },

  obtenerUltimosTitulos: async (take: number) => {
    return prisma.noticia.findMany({
      take,
      orderBy: { fecha: "desc" },
      select: { titulo: true },
    });
  },
};
