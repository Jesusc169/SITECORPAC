import { NoticiaModel } from "@/models/noticiaModel";
import { FeriaModel } from "@/models/feriaModel";
import { SorteoModel } from "@/models/sorteoModel";
import { contarEstatutoContenido } from "@/models/estatutoModel";

export const DashboardController = {
  obtenerResumen: async () => {
    const [totalNoticias, totalEventos, totalSorteos, totalDocumentos, ultimasNoticias] =
      await Promise.all([
        NoticiaModel.contar(),
        FeriaModel.contarActivas(),
        SorteoModel.contarActivos(),
        contarEstatutoContenido(),
        NoticiaModel.obtenerUltimosTitulos(4),
      ]);

    return { totalNoticias, totalEventos, totalSorteos, totalDocumentos, ultimasNoticias };
  },
};
