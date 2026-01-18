import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import FeriasClient from "./FeriasClient";

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
