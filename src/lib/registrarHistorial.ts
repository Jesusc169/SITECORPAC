import prisma from "@/lib/prisma";

export async function registrarHistorial({
  feriaId,
  accion,
  detalle,
  usuario = "Administrador",
}: {
  feriaId: number;
  accion: string;
  detalle: string;
  usuario?: string;
}) {
  await prisma.feria_historial.create({
    data: {
      feria_id: feriaId,
      accion,
      detalle,
      usuario,
    },
  });
}
