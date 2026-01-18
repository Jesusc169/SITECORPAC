import prisma from "@/lib/prisma";

export class EventoFeriaModel {
  /* =========================
     LISTAR FERIAS (FILTRANDO POR FECHAS)
     ========================= */
  static async listar(anio?: number) {
    return prisma.evento_feria.findMany({
      where: {
        estado: true,
        ...(anio && {
          evento_feria_fecha: {
            some: {
              fecha: {
                gte: new Date(`${anio}-01-01`),
                lt: new Date(`${anio + 1}-01-01`),
              },
            },
          },
        }),
      },
      orderBy: { id: "desc" },
      include: {
        evento_feria_empresa: {
          include: { empresa: true },
        },
        evento_feria_fecha: true,
      },
    });
  }

  /* =========================
     OBTENER POR ID
     ========================= */
  static async obtenerPorId(id: number) {
    return prisma.evento_feria.findUnique({
      where: { id },
      include: {
        evento_feria_empresa: {
          include: { empresa: true },
        },
        evento_feria_fecha: true,
      },
    });
  }

  /* =========================
     ACTUALIZAR
     ========================= */
  static async actualizar(id: number, data: any) {
    const { titulo, descripcion, imagen_portada, empresas = [], fechas = [] } =
      data;

    await prisma.evento_feria.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        imagen_portada,
      },
    });

    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: id },
    });

    if (empresas.length) {
      await prisma.evento_feria_empresa.createMany({
        data: empresas.map((empresa_id: number) => ({
          feria_id: id,
          empresa_id,
        })),
      });
    }

    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: id },
    });

    if (fechas.length) {
      await prisma.evento_feria_fecha.createMany({
        data: fechas.map((f: any) => ({
          feria_id: id,
          fecha: new Date(f.fecha),
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          ubicacion: f.ubicacion,
          zona: f.zona ?? null,
        })),
      });
    }

    return this.obtenerPorId(id);
  }

  /* =========================
     ELIMINAR
     ========================= */
  static async eliminar(id: number) {
    await prisma.evento_feria_empresa.deleteMany({
      where: { feria_id: id },
    });

    await prisma.evento_feria_fecha.deleteMany({
      where: { feria_id: id },
    });

    return prisma.evento_feria.delete({ where: { id } });
  }
}
