import prisma from "@/lib/prisma";

const SIN_PASSWORD = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  permisos: true,
  createdAt: true,
  activo: true,
} as const;

export const UserModel = {
  obtenerTodos: async () => {
    return prisma.user.findMany({
      orderBy: { id: "asc" },
      select: SIN_PASSWORD,
    });
  },

  obtenerPorId: async (id: number) => {
    return prisma.user.findUnique({ where: { id }, select: SIN_PASSWORD });
  },

  existeEmail: async (email: string) => {
    const usuario = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return usuario !== null;
  },

  crear: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    permisos: string[];
  }) => {
    return prisma.user.create({
      data,
      select: SIN_PASSWORD,
    });
  },

  actualizar: async (
    id: number,
    data: { nombre: string; rol: string; permisos: string[]; password?: string }
  ) => {
    return prisma.user.update({
      where: { id },
      // Contraseña nueva = se cierran todas las sesiones abiertas de esa cuenta
      data: data.password ? { ...data, sesionVersion: { increment: 1 } } : data,
      select: { ...SIN_PASSWORD, sesionVersion: true },
    });
  },

  cambiarActivo: async (id: number, activo: boolean) => {
    return prisma.user.update({
      where: { id },
      // Al desactivar también se cierran sus sesiones abiertas
      data: activo ? { activo } : { activo, sesionVersion: { increment: 1 } },
      select: SIN_PASSWORD,
    });
  },

  cerrarSesiones: async (id: number) => {
    return prisma.user.update({
      where: { id },
      data: { sesionVersion: { increment: 1 } },
      select: { ...SIN_PASSWORD, sesionVersion: true },
    });
  },

  eliminar: async (id: number) => {
    return prisma.user.delete({ where: { id } });
  },
};
