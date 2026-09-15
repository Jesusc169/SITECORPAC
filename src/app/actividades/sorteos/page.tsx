import type { Metadata } from "next";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import SorteosClient from "./SorteosClient";

export const metadata: Metadata = {
  title: "Sorteos | SITECORPAC",
  description: "Sorteos especiales del SITECORPAC en fechas conmemorativas.",
};

export default function Page() {
  return (
    <main>
      <Cabecera />
      <Navbar />
      <SorteosClient />
      <Footer />
    </main>
  );
}
