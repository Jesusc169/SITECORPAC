import prisma from "@/lib/prisma";
import type { noticia } from "@prisma/client";

const CON_PDFS = {
  noticia_pdf: { orderBy: { orden: "asc" as const } },
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
  }) => {
    const { pdfs, ...resto } = data;
    return prisma.noticia.create({
      data: {
        ...resto,
        noticia_pdf: { create: pdfs },
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
};
