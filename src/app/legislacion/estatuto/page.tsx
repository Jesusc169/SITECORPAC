import type { Metadata } from "next";
import { EstatutoController } from "@/controllers/estatutoController";
import EstatutoView from "@/views/EstatutoView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Estatuto del SITECORPAC | SITECORPAC",
  description: "Estatuto que rige la organización interna del SITECORPAC.",
};

export default async function EstatutoPage() {
  const data = await EstatutoController.getData();

  return (
    <PaginaPublica>
      <EstatutoView data={data} />
    </PaginaPublica>
  );
}
