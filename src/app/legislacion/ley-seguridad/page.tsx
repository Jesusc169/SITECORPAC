import { LeySeguridadController } from "@/controllers/leySeguridadController";
import LeySeguridadView from "@/views/LeySeguridadView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

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
