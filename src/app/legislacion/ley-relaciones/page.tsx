import type { Metadata } from "next";
import { LeyRelacionesController } from "@/controllers/leyRelacionesController";
import LeyRelacionesView from "@/views/LeyRelacionesView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Ley de Relaciones Colectivas de Trabajo | SITECORPAC",
  description:
    "Marco normativo que regula la libertad sindical, la negociación colectiva y el derecho de huelga en el Perú.",
};

export default async function LeyRelacionesPage() {
  const data = await LeyRelacionesController.getData();

  return (
    <PaginaPublica>
      <LeyRelacionesView data={data} />
    </PaginaPublica>
  );
}
