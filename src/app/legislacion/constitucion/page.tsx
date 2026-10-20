import type { Metadata } from "next";
import { ConstitucionController } from "@/controllers/constitucionController";
import ConstitucionView from "@/views/ConstitucionView";

import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";

export const metadata: Metadata = {
  title: "Constitución Política del Perú | SITECORPAC",
  description:
    "Derechos laborales reconocidos por la Constitución Política del Perú.",
};

export default async function ConstitucionPage() {
  const data = await ConstitucionController.getData();

  return (
    <PaginaPublica>
      <ConstitucionView data={data} />
    </PaginaPublica>
  );
}
