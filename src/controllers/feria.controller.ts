// src/controllers/feria.controller.ts
import { EventoFeriaModel } from "@/models/EventoFeria.model";

export const FeriaController = {
  /* =========================
     LISTAR FERIAS
     ========================= */
  async listarFerias(anio?: number) {
    return await EventoFeriaModel.listar(anio);
  },

  /* =========================
     OBTENER FERIA POR ID
     ========================= */
  async obtenerFeria(id: number) {
    const feria = await EventoFeriaModel.obtenerPorId(id);

    if (!feria) {
      throw new Error("Feria no encontrada");
    }

    return feria;
  },

  /* =========================
     ACTUALIZAR FERIA
     ========================= */
  async actualizarFeria(id: number, data: any) {
    return await EventoFeriaModel.actualizar(id, data);
  },

  /* =========================
     ELIMINAR FERIA
     ========================= */
  async eliminarFeria(id: number) {
    return await EventoFeriaModel.eliminar(id);
  },
};
