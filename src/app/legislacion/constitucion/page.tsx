import type { Metadata } from "next";
import { ConstitucionController } from "@/controllers/constitucionController";
import ConstitucionView from "@/views/ConstitucionView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Constitución Política del Perú | SITECORPAC",
  description:
    "Derechos laborales reconocidos por la Constitución Política del Perú.",
};

export default async function ConstitucionPage() {
  const data = await ConstitucionController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <ConstitucionView data={data} />
      <Footer />
    </main>
  );
}
