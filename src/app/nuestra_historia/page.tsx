// src/app/nuestra-historia/page.tsx
import type { Metadata } from "next";
import { NuestraHistoriaController } from "../../controllers/NuestraHistoriaController";
import NuestraHistoriaView from "../../views/NuestraHistoriaView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Nuestra Historia | SITECORPAC",
  description: "La historia del SITECORPAC y su compromiso con los trabajadores de CORPAC.",
};

export default function NuestraHistoriaPage() {
  const data = NuestraHistoriaController.getData();

  return (
    <PaginaPublica>
      <NuestraHistoriaView data={data} />
    </PaginaPublica>
  );
}
