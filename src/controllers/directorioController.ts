import { DirectorioModel } from "@/models/directorioModel";
import type { Directorio } from "@prisma/client";

export const DirectorioController = {
  obtenerDirectorio: (): Promise<Directorio[]> => DirectorioModel.obtenerTodos(),

  crearMiembro: (data: {
    nombre: string;
    cargo: string;
    correo: string;
    telefono: string;
    fotoUrl?: string;
    periodoInicio: Date;
    periodoFin?: Date;
  }): Promise<Directorio> => DirectorioModel.crear(data),

  actualizarMiembro: (id: number, data: Partial<Directorio>): Promise<Directorio> =>
    DirectorioModel.actualizar(id, data),

  eliminarMiembro: (id: number): Promise<Directorio> => DirectorioModel.eliminar(id),
};
