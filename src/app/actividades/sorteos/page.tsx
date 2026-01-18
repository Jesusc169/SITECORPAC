import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import SorteosClient from "./SorteosClient";

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
