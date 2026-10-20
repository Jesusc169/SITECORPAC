import type { Metadata } from "next";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import DirectorioClient from "./DirectorioClient";

export const metadata: Metadata = {
  title: "Directorio de Representantes | SITECORPAC",
  description: "Representantes elegidos del SITECORPAC.",
};

export default function DirectorioPage() {
  return (
    <PaginaPublica>
      <DirectorioClient />
    </PaginaPublica>
  );
}
