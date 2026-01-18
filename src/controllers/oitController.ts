import { obtenerContenidoOIT } from "@/models/oitModel";

export class OitController {
  static async getData() {
    return {
      contenidos: await obtenerContenidoOIT(),
    };
  }
}
