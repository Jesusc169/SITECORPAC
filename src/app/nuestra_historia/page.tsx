// src/app/nuestra-historia/page.tsx
import type { Metadata } from "next";
import { NuestraHistoriaController } from "../../controllers/NuestraHistoriaController";
import NuestraHistoriaView from "../../views/NuestraHistoriaView";

// Componentes comunes
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export const metadata: Metadata = {
  title: "Nuestra Historia | SITECORPAC",
  description: "La historia del SITECORPAC y su compromiso con los trabajadores de CORPAC.",
};

export default function NuestraHistoriaPage() {
  const data = NuestraHistoriaController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <NuestraHistoriaView data={data} />
      <Footer />
    </main>
  );
}
