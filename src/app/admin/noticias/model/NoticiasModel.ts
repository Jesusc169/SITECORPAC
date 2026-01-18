import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const NoticiasModel = {
  // 🔹 Obtener todas las noticias
  async obtenerTodas() {
    return await prisma.noticia.findMany({
      orderBy: { fecha: "desc" }, // según tu schema
    });
  },

  // 🔹 Crear una nueva noticia
  async crear(data: {
    titulo: string;
    descripcion: string;
    autor: string;
    contenido?: string | null;
    imagen?: string | null;
  }) {
    return await prisma.noticia.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        contenido: data.contenido || null,
        imagen: data.imagen || null,
      },
    });
  },
};
