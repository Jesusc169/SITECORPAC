// src/app/nuestra-historia/page.tsx
import { NuestraHistoriaController } from "../../controllers/NuestraHistoriaController";
import NuestraHistoriaView from "../../views/NuestraHistoriaView";

// Componentes comunes
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

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
