import { obtenerEstatuto } from "@/models/estatutoModel";

export class EstatutoController {
  static async getData() {
    const estatuto = await obtenerEstatuto();

    return {
      estatuto,
    };
  }
}
