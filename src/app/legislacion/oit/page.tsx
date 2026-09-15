import type { Metadata } from "next";
import { OitController } from "@/controllers/oitController";
import OitView from "@/views/OitView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Organización Internacional del Trabajo | SITECORPAC",
  description:
    "Principios y normas de la OIT que respaldan la labor sindical del SITECORPAC.",
};

export default async function OitPage() {
  const data = await OitController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <OitView data={data} />
      <Footer />
    </main>
  );
}
