import { DirectorioModel } from "@/models/directorioModel";
import type { directorio } from "@prisma/client";

export const DirectorioController = {
  obtenerDirectorio: (): Promise<directorio[]> => DirectorioModel.obtenerTodos(),

  crearMiembro: (data: {
    nombre: string;
    cargo: string;
    correo: string;
    telefono: string;
    fotoUrl?: string;
    periodoInicio: Date;
    periodoFin?: Date;
  }): Promise<directorio> => DirectorioModel.crear(data),

  actualizarMiembro: (id: number, data: Partial<directorio>): Promise<directorio> =>
    DirectorioModel.actualizar(id, data),

  eliminarMiembro: (id: number): Promise<directorio> => DirectorioModel.eliminar(id),
};
