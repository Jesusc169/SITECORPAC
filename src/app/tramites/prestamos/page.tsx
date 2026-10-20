import type { Metadata } from "next";
import { PrestamosController } from "@/controllers/prestamosController";
import PrestamosView from "@/views/PrestamosView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Solicitar Préstamo | SITECORPAC",
  description:
    "Préstamos a través de cooperativas convenio para afiliados del SITECORPAC.",
};

export default async function PrestamosPage() {
  const data = await PrestamosController.getData();

  return (
    <PaginaPublica>
      <PrestamosView data={data} />
    </PaginaPublica>
  );
}
