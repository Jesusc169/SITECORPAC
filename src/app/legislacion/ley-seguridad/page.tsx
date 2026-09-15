import type { Metadata } from "next";
import { LeySeguridadController } from "@/controllers/leySeguridadController";
import LeySeguridadView from "@/views/LeySeguridadView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Ley de Seguridad y Salud en el Trabajo | SITECORPAC",
  description:
    "Ley N.º 29783: prevención de riesgos laborales para todos los trabajadores.",
};

export default async function LeySeguridadPage() {
  const data = await LeySeguridadController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <LeySeguridadView data={data} />
      <Footer />
    </main>
  );
}
