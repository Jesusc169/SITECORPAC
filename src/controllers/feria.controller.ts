// src/controllers/feria.controller.ts
import { EventoFeriaModel } from "@/models/eventoFeria.model";

export const FeriaController = {
  async listarFerias() {
    return await EventoFeriaModel.getFeriasActivas();
  },

  async obtenerFeria(id: number) {
    const feria = await EventoFeriaModel.getFeriaById(id);
    if (!feria) {
      throw new Error("Feria no encontrada");
    }
    return feria;
  },
};
