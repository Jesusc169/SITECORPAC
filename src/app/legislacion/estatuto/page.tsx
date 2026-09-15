import type { Metadata } from "next";
import { EstatutoController } from "@/controllers/estatutoController";
import EstatutoView from "@/views/EstatutoView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Estatuto del SITECORPAC | SITECORPAC",
  description: "Estatuto que rige la organización interna del SITECORPAC.",
};

export default async function EstatutoPage() {
  const data = await EstatutoController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <EstatutoView data={data} />
      <Footer />
    </main>
  );
}
