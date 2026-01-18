import {
  obtenerCooperativas,
  obtenerRequisitos,
  obtenerFaqs,
} from "@/models/prestamoModel";

export class PrestamosController {
  static async getData() {
    return {
      cooperativas: await obtenerCooperativas(),
      requisitos: await obtenerRequisitos(),
      faqs: await obtenerFaqs(),
    };
  }
}
