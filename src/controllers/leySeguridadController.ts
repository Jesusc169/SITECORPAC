import { obtenerContenidoLeySeguridad } from "@/models/leySeguridadModel";

export class LeySeguridadController {
  static async getData() {
    return {
      contenidos: await obtenerContenidoLeySeguridad(),
    };
  }
}
