import { LeyRelacionesController } from "@/controllers/leyRelacionesController";
import LeyRelacionesView from "@/views/LeyRelacionesView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default async function LeyRelacionesPage() {
  const data = await LeyRelacionesController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <LeyRelacionesView data={data} />
      <Footer />
    </main>
  );
}
