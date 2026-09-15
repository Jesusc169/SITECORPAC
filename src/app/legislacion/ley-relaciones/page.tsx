import type { Metadata } from "next";
import { LeyRelacionesController } from "@/controllers/leyRelacionesController";
import LeyRelacionesView from "@/views/LeyRelacionesView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Ley de Relaciones Colectivas de Trabajo | SITECORPAC",
  description:
    "Marco normativo que regula la libertad sindical, la negociación colectiva y el derecho de huelga en el Perú.",
};

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
