import type { Metadata } from "next";
import { PrestamosController } from "@/controllers/prestamosController";
import PrestamosView from "@/views/PrestamosView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Solicitar Préstamo | SITECORPAC",
  description:
    "Préstamos a través de cooperativas convenio para afiliados del SITECORPAC.",
};

export default async function PrestamosPage() {
  const data = await PrestamosController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <PrestamosView data={data} />
      <Footer />
    </main>
  );
}
