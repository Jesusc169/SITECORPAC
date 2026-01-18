import { obtenerContenidoConstitucion } from "@/models/constitucionModel";

export class ConstitucionController {
  /**
   * Obtiene el contenido activo de la Constitución Política del Perú
   */
  static async getData() {
    return {
      contenidos: await obtenerContenidoConstitucion(),
    };
  }
}
