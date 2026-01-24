// controllers/NoticiasController.ts
import prisma from "@/lib/prisma";

export class NoticiasController {
  // 🟢 Obtener todas las noticias (para histórico)
  static async obtenerNoticias() {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
    });
  }

  // 🔵 Obtener las últimas N noticias (para la página principal)
  static async obtenerUltimasNoticias(limit = 3) {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
      take: limit,
    });
  }

  // 🟣 Obtener noticia por ID (para página individual)
  static async obtenerNoticiaPorId(id: number) {
    return await prisma.noticia.findUnique({
      where: { id },
    });
  }

  // 🟡 Crear noticia
  static async crearNoticia(data: {
    titulo: string;
    descripcion: string;
    contenido?: string;
    imagen?: string;
    fecha?: Date;
    autor: string;
  }) {
    return await prisma.noticia.create({ data });
  }

  // 🟠 Actualizar noticia
  static async actualizarNoticia(id: number, data: any) {
    return await prisma.noticia.update({
      where: { id },
      data,
    });
  }

  // 🔴 Eliminar noticia
  static async eliminarNoticia(id: number) {
    return await prisma.noticia.delete({
      where: { id },
    });
  }
}
