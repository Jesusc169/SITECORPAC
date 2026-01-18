import { EstatutoController } from "@/controllers/estatutoController";
import EstatutoView from "@/views/EstatutoView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

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
