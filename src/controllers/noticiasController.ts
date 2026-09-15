// src/controllers/noticiasController.ts
import prisma from "@/lib/prisma";

export class NoticiasController {
  // 🟢 Obtener todas las noticias
  static async obtenerNoticias() {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
    });
  }

  // 🔵 Obtener últimas noticias
  static async obtenerUltimasNoticias(limit = 3) {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" },
      take: limit,
    });
  }

  // 🟣 Obtener noticia por ID
  static async obtenerNoticiaPorId(id: number) {
    return await prisma.noticia.findUnique({
      where: { id },
      include: {
        noticia_pdf: { orderBy: { orden: "asc" } },
      },
    });
  }

  // 🟡 Crear noticia (CORREGIDO)
  static async crearNoticia(data: {
    titulo: string;
    descripcion: string;
    contenido?: string;
    imagen?: string;
    fecha?: Date;
    autor: string;
  }) {
    return await prisma.noticia.create({
      data: {
        ...data,
        updatedAt: new Date(), // ✅ FIX CLAVE
      },
    });
  }

  // 🟠 Actualizar noticia
  static async actualizarNoticia(id: number, data: any) {
    return await prisma.noticia.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(), // ✅ buena práctica
      },
    });
  }

  // 🔴 Eliminar noticia
  static async eliminarNoticia(id: number) {
    return await prisma.noticia.delete({
      where: { id },
    });
  }
}
