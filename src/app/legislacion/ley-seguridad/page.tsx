import type { Metadata } from "next";
import { LeySeguridadController } from "@/controllers/leySeguridadController";
import LeySeguridadView from "@/views/LeySeguridadView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Ley de Seguridad y Salud en el Trabajo | SITECORPAC",
  description:
    "Ley N.º 29783: prevención de riesgos laborales para todos los trabajadores.",
};

export default async function LeySeguridadPage() {
  const data = await LeySeguridadController.getData();

  return (
    <PaginaPublica>
      <LeySeguridadView data={data} />
    </PaginaPublica>
  );
}
