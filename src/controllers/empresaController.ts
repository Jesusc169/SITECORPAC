import { EmpresaModel } from "@/models/empresaModel";

export const EmpresaController = {
  obtenerEmpresasParaSelector: () => EmpresaModel.obtenerNombres(),
};
