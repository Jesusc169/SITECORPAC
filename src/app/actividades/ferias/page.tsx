import type { Metadata } from "next";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import FeriasClient from "./FeriasClient";

export const metadata: Metadata = {
  title: "Ferias | SITECORPAC",
  description: "Ferias organizadas por el SITECORPAC para sus afiliados.",
};

export default function FeriasPage() {
  return (
    <PaginaPublica>
      <FeriasClient />
    </PaginaPublica>
  );
}
