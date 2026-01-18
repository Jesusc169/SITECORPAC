import prisma from "@/lib/prisma";

// 🟢 Obtener todas las noticias
export async function obtenerNoticias() {
  return await prisma.noticia.findMany({
    orderBy: { fecha: "desc" },
  });
}

// 🔵 Obtener noticia por ID
export async function obtenerNoticiaPorId(id) {
  return await prisma.noticia.findUnique({
    where: { id: Number(id) },
  });
}

// 🟡 Crear noticia
export async function crearNoticia(data) {
  return await prisma.noticia.create({ data });
}

// 🟠 Actualizar noticia
export async function actualizarNoticia(id, data) {
  return await prisma.noticia.update({
    where: { id: Number(id) },
    data,
  });
}

// 🔴 Eliminar noticia
export async function eliminarNoticia(id) {
  return await prisma.noticia.delete({
    where: { id: Number(id) },
  });
}
