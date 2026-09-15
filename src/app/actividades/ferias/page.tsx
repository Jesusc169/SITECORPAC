import type { Metadata } from "next";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import FeriasClient from "./FeriasClient";

export const metadata: Metadata = {
  title: "Ferias | SITECORPAC",
  description: "Ferias organizadas por el SITECORPAC para sus afiliados.",
};

export default function FeriasPage() {
  return (
    <main>
      <Cabecera />
      <Navbar />
      <FeriasClient />
      <Footer />
    </main>
  );
}
