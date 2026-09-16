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

export const DirectorioController = {
  obtenerDirectorio: (): Promise<directorio[]> => DirectorioModel.obtenerTodos(),

  // Forma normalizada que consume el sitio público (nombres de campo distintos a la BD)
  obtenerDirectorioPublico: async () => {
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

  crearMiembro: async (datos: DatosMiembro): Promise<directorio> => {
    let fotoUrl: string | null = null;

    if (datos.fotoFile && datos.fotoFile.size > 0) {
      fotoUrl = await guardarFotoDirectorio(datos.fotoFile);
    }

    const nuevoOrden = (await DirectorioModel.obtenerUltimoOrden()) + 1;

    return DirectorioModel.crear({
      nombre: datos.nombre,
      cargo: datos.cargo,
      correo: datos.correo,
      telefono: datos.telefono,
      fotoUrl,
      periodoInicio: datos.periodoInicio,
      periodoFin: datos.periodoFin ?? null,
      orden: nuevoOrden,
    });
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

    return DirectorioModel.actualizar(id, data);
  },

  eliminarMiembro: async (id: number): Promise<directorio | null> => {
    const miembro = await DirectorioModel.obtenerPorId(id);
    if (!miembro) return null;

    await borrarFotoDirectorio(miembro.fotoUrl);
    return DirectorioModel.eliminar(id);
  },
};
