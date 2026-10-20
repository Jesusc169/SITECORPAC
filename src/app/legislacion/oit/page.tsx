import type { Metadata } from "next";
import { OitController } from "@/controllers/oitController";
import OitView from "@/views/OitView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Organización Internacional del Trabajo | SITECORPAC",
  description:
    "Principios y normas de la OIT que respaldan la labor sindical del SITECORPAC.",
};

export default async function OitPage() {
  const data = await OitController.getData();

  return (
    <PaginaPublica>
      <OitView data={data} />
    </PaginaPublica>
  );
}
