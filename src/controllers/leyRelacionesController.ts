import { obtenerLeyRelaciones } from "@/models/leyRelacionesModel";

export class LeyRelacionesController {
  static async getData() {
    const ley = await obtenerLeyRelaciones();

    return {
      ley,
    };
  }
}
