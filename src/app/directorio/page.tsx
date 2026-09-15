import type { Metadata } from "next";
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import DirectorioClient from "./DirectorioClient";

export const metadata: Metadata = {
  title: "Directorio de Representantes | SITECORPAC",
  description: "Representantes elegidos del SITECORPAC.",
};

export default function DirectorioPage() {
  return (
    <>
      <Cabecera />
      <Navbar />
      <DirectorioClient />
      <Footer />
    </>
  );
}
