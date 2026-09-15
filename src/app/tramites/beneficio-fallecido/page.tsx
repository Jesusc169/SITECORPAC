// src/app/beneficio-fallecido/page.tsx
import type { Metadata } from "next";
import { obtenerBeneficioFallecido } from "@/controllers/beneficioFallecidoController";
import BeneficioFallecidoView from "@/views/BeneficioFallecidoView";

// Componentes comunes
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Beneficio por Fallecimiento | SITECORPAC",
  description:
    "Apoyo económico del SITECORPAC para las familias de colaboradores fallecidos.",
};

export default async function BeneficioFallecidoPage() {
  // Traemos los datos desde el controller
  const data = await obtenerBeneficioFallecido();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <BeneficioFallecidoView {...data} />
      <Footer />
    </main>
  );
}
