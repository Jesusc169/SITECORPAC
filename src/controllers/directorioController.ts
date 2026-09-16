import { unstable_cache, revalidateTag } from "next/cache";
import { DirectorioModel } from "@/models/directorioModel";
import { guardarFotoDirectorio, borrarFotoDirectorio } from "@/lib/archivosDirectorio";
import type { directorio } from "@prisma/client";

interface DatosMiembro {
  nombre: string;
  cargo: string;
  correo: string;
  telefono: string;
  periodoInicio: Date;
  periodoFin?: Date | null;
  fotoFile?: File | null;
}

interface DatosMiembroParcial {
  nombre?: string;
  cargo?: string;
  correo?: string;
  telefono?: string;
  periodoInicio?: Date;
  periodoFin?: Date | null;
  fotoFile?: File | null;
}

// Lectura pública cacheada 60s, con tag "directorio" para invalidarla al
// instante desde crear/editar/eliminar (revalidateTag más abajo). Antes
// tenía su propia caché manual en la ruta (una variable en memoria), pero
// eso da un resultado distinto por cada proceso de PM2 en modo cluster;
// esto vive en la caché de datos de Next, compartida por igual.
const obtenerDirectorioPublicoCacheado = unstable_cache(
  async () => {
    const data = await DirectorioModel.obtenerTodos();

    return data.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      cargo: d.cargo,
      email: d.correo,
      telefono: d.telefono,
      foto: d.fotoUrl,
      fechaInicio: d.periodoInicio,
      fechaFin: d.periodoFin,
      createdAt: d.createdAt,
      orden: d.orden,
    }));
  },
  ["directorio-publico"],
  { revalidate: 60, tags: ["directorio"] }
);

export const DirectorioController = {
  obtenerDirectorio: (): Promise<directorio[]> => DirectorioModel.obtenerTodos(),

  // Forma normalizada que consume el sitio público (nombres de campo distintos a la BD)
  obtenerDirectorioPublico: () => obtenerDirectorioPublicoCacheado(),

  crearMiembro: async (datos: DatosMiembro): Promise<directorio> => {
    let fotoUrl: string | null = null;

    if (datos.fotoFile && datos.fotoFile.size > 0) {
      fotoUrl = await guardarFotoDirectorio(datos.fotoFile);
    }

    const nuevoOrden = (await DirectorioModel.obtenerUltimoOrden()) + 1;

    const miembro = await DirectorioModel.crear({
      nombre: datos.nombre,
      cargo: datos.cargo,
      correo: datos.correo,
      telefono: datos.telefono,
      fotoUrl,
      periodoInicio: datos.periodoInicio,
      periodoFin: datos.periodoFin ?? null,
      orden: nuevoOrden,
    });

    revalidateTag("directorio", "max");
    return miembro;
  },

  actualizarMiembro: async (
    id: number,
    datos: DatosMiembroParcial
  ): Promise<directorio | null> => {
    const miembro = await DirectorioModel.obtenerPorId(id);
    if (!miembro) return null;

    let fotoUrl = miembro.fotoUrl;

    if (datos.fotoFile && datos.fotoFile.size > 0) {
      fotoUrl = await guardarFotoDirectorio(datos.fotoFile);
      await borrarFotoDirectorio(miembro.fotoUrl);
    }

    const data: Partial<directorio> = {};
    if (datos.nombre !== undefined) data.nombre = datos.nombre;
    if (datos.cargo !== undefined) data.cargo = datos.cargo;
    if (datos.correo !== undefined) data.correo = datos.correo;
    if (datos.telefono !== undefined) data.telefono = datos.telefono;
    if (datos.periodoInicio !== undefined) data.periodoInicio = datos.periodoInicio;
    if (datos.periodoFin !== undefined) data.periodoFin = datos.periodoFin;
    if (fotoUrl !== miembro.fotoUrl) data.fotoUrl = fotoUrl;

    const actualizado = await DirectorioModel.actualizar(id, data);
    revalidateTag("directorio", "max");
    return actualizado;
  },

  eliminarMiembro: async (id: number): Promise<directorio | null> => {
    const miembro = await DirectorioModel.obtenerPorId(id);
    if (!miembro) return null;

    await borrarFotoDirectorio(miembro.fotoUrl);
    const eliminado = await DirectorioModel.eliminar(id);
    revalidateTag("directorio", "max");
    return eliminado;
  },
};
