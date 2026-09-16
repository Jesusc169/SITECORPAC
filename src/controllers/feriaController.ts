import { unstable_cache, revalidateTag } from "next/cache";
import { FeriaModel } from "@/models/feriaModel";
import { guardarImagenFeria } from "@/lib/archivosFeria";

export class FeriaValidationError extends Error {}

interface FechaInput {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

function normalizarFechas(fechas: FechaInput[]) {
  return fechas.map((f) => ({
    fecha: new Date(f.fecha),
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
    ubicacion: f.ubicacion,
    zona: f.zona || null,
  }));
}

// Lectura pública cacheada 60s, con tag "ferias" para invalidarla al
// instante desde crear/editar/duplicar/eliminar (revalidateTag más abajo).
const obtenerFeriasPublicasCacheadas = unstable_cache(
  async (anio: number | null, skip: number, take: number) =>
    FeriaModel.obtenerPublicas({ anio, skip, take }),
  ["ferias-publicas"],
  { revalidate: 60, tags: ["ferias"] }
);

export const FeriaController = {
  obtenerFeriasAdmin: () => FeriaModel.obtenerTodas(),

  obtenerFeriasPublicas: async (opciones: { anioParam: string | null; pageParam: string | null }) => {
    const page = Number(opciones.pageParam || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    let anio: number | null = null;
    if (opciones.anioParam && /^\d{4}$/.test(opciones.anioParam)) {
      anio = Number(opciones.anioParam);
    }

    return obtenerFeriasPublicasCacheadas(anio, skip, limit);
  },

  obtenerFeriaPorId: (id: number) => FeriaModel.obtenerPorId(id),

  crearFeria: async (input: {
    titulo?: string;
    descripcion?: string;
    anio: number;
    imagenFile: File | null;
    empresas: number[];
    fechas: FechaInput[];
  }) => {
    const titulo = input.titulo?.trim();
    const descripcion = input.descripcion?.trim();

    if (!titulo || !descripcion || !input.anio) {
      throw new FeriaValidationError("Datos incompletos");
    }

    let imagen_portada: string | null = null;
    if (input.imagenFile && input.imagenFile.size > 0) {
      imagen_portada = await guardarImagenFeria(input.imagenFile);
    }

    const feria = await FeriaModel.crear({
      titulo,
      descripcion,
      anio: input.anio,
      imagen_portada,
      fechas: normalizarFechas(input.fechas),
      empresas: input.empresas,
    });

    revalidateTag("ferias", "max");
    return feria;
  },

  actualizarFeria: async (
    id: number,
    input: {
      titulo: string;
      descripcion: string;
      imagenFile: File | null;
      empresas: number[];
      fechas: FechaInput[];
    }
  ) => {
    let imagen_portada: string | undefined;
    if (input.imagenFile && input.imagenFile.size > 0) {
      imagen_portada = await guardarImagenFeria(input.imagenFile);
    }

    await FeriaModel.actualizar(id, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      ...(imagen_portada && { imagen_portada }),
    });

    await FeriaModel.reemplazarEmpresas(id, input.empresas);
    await FeriaModel.reemplazarFechas(id, normalizarFechas(input.fechas));

    const feria = await FeriaModel.obtenerPorId(id);
    revalidateTag("ferias", "max");
    return feria;
  },

  duplicarFeria: async (id: number) => {
    const original = await FeriaModel.obtenerPorId(id);
    if (!original) return null;

    const nuevaFeria = await FeriaModel.crear({
      titulo: original.titulo + " (Copia)",
      descripcion: original.descripcion ?? "",
      anio: new Date().getFullYear(),
      imagen_portada: original.imagen_portada ?? null,
      fechas: original.evento_feria_fecha.map((f) => ({
        fecha: f.fecha,
        hora_inicio: f.hora_inicio,
        hora_fin: f.hora_fin,
        ubicacion: f.ubicacion,
        zona: f.zona,
      })),
      empresas: original.evento_feria_empresa.map((e) => e.empresa_id),
    });

    revalidateTag("ferias", "max");
    return nuevaFeria;
  },

  eliminarFeria: async (id: number) => {
    await FeriaModel.eliminarRelaciones(id);
    await FeriaModel.eliminar(id);
    revalidateTag("ferias", "max");
  },
};
