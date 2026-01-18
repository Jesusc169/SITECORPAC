// src/controllers/NuestraHistoriaController.ts
import { nuestraHistoriaData } from "../models/NuestraHistoriaModel";

export class NuestraHistoriaController {
  static getData() {
    return nuestraHistoriaData;
  }
}
