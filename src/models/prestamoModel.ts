import prisma from "@/lib/prisma";

/**
 * Cooperativas activas
 */
export async function obtenerCooperativas() {
  return prisma.cooperativas.findMany({
    where: { estado: 1 },
    orderBy: { created_at: "asc" }, // 👈 OBLIGATORIO
  });
}

/**
 * Requisitos activos
 */
export async function obtenerRequisitos() {
  return prisma.prestamo_requisitos.findMany({
    where: { estado: 1 },
    orderBy: { created_at: "asc" }, // 👈 igual aquí
  });
}

/**
 * FAQ activos
 */
export async function obtenerFaqs() {
  return prisma.prestamo_faq.findMany({
    where: { estado: 1 },
    orderBy: { created_at: "asc" }, // 👈 igual aquí
  });
}
