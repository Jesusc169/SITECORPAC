import { unstable_cache, revalidateTag } from "next/cache";
import { SorteoModel } from "@/models/sorteoModel";
import { guardarImagenSorteo } from "@/lib/archivosSorteo";

type Estado = "ACTIVO" | "INACTIVO";

interface Premio {
  nombre: string;
  descripcion: string;
  cantidad: number;
}

interface DatosSorteo {
  nombre: string;
  descripcion: string;
  lugar: string;
  anio: number;
  estado: Estado;
  fecha_hora: Date;
  premios: Premio[];
  imagenFile: File | null;
  imagenUrl: string | null;
}

function normalizarPremios(premios: any[]): Premio[] {
  return (premios || []).map((p) => ({
    nombre: p.nombre || "",
    descripcion: p.descripcion || "",
    cantidad: Number(p.cantidad) || 1,
  }));
}

function fechaValida(fecha: Date): Date {
  return isNaN(fecha.getTime()) ? new Date() : fecha;
}

// Lectura pública cacheada 60s, con tag "sorteos" para invalidarla al
// instante desde crear/editar/duplicar/eliminar (revalidateTag más abajo).
const obtenerSorteosPublicosCacheados = unstable_cache(
  async (anio: number | null) => SorteoModel.obtenerActivos(anio),
  ["sorteos-publicos"],
  { revalidate: 60, tags: ["sorteos"] }
);

export const SorteoController = {
  obtenerSorteosPublicos: (anioParam: string | null) => {
    const anio = anioParam && /^\d{4}$/.test(anioParam) ? Number(anioParam) : null;
    return obtenerSorteosPublicosCacheados(anio);
  },

  obtenerSorteosAdmin: () => SorteoModel.obtenerTodos(),

  obtenerSorteoPorId: (id: number) => SorteoModel.obtenerPorId(id),

  crearSorteo: async (input: DatosSorteo) => {
    let imagen: string | null = input.imagenUrl;
    if (input.imagenFile && input.imagenFile.size > 0) {
      imagen = await guardarImagenSorteo(input.imagenFile);
    }

    const sorteo = await SorteoModel.crear({
      nombre: input.nombre,
      descripcion: input.descripcion,
      lugar: input.lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: fechaValida(input.fecha_hora),
      imagen,
      premios: normalizarPremios(input.premios),
    });

    revalidateTag("sorteos", "max");
    return sorteo;
  },

  actualizarSorteo: async (
    id: number,
    input: {
      nombre: string;
      descripcion: string;
      lugar: string;
      anio: number;
      estado: Estado;
      fecha_hora: Date;
      premios: Premio[];
      imagenFile: File | null;
    }
  ) => {
    let imagen: string | undefined;
    if (input.imagenFile && input.imagenFile.size > 0) {
      imagen = await guardarImagenSorteo(input.imagenFile);
    }

    const sorteo = await SorteoModel.actualizar(id, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      lugar: input.lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: input.fecha_hora,
      premios: normalizarPremios(input.premios),
      ...(imagen && { imagen }),
    });

    revalidateTag("sorteos", "max");
    return sorteo;
  },

  duplicarSorteo: async (id: number) => {
    const original = await SorteoModel.obtenerPorId(id);
    if (!original) return null;

    const nuevo = await SorteoModel.crear({
      nombre: original.nombre + " (Copia)",
      descripcion: original.descripcion,
      lugar: original.lugar,
      anio: original.anio,
      estado: "ACTIVO",
      fecha_hora: original.fecha_hora,
      imagen: original.imagen,
      premios: original.sorteo_producto.map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        cantidad: p.cantidad ?? 1,
      })),
    });

    revalidateTag("sorteos", "max");
    return nuevo;
  },

  eliminarSorteo: async (id: number) => {
    await SorteoModel.eliminar(id);
    revalidateTag("sorteos", "max");
  },
};
