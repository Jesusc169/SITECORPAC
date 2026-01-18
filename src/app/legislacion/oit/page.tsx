import { OitController } from "@/controllers/oitController";
import OitView from "@/views/OitView";

import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default async function OitPage() {
  const data = await OitController.getData();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <OitView data={data} />
      <Footer />
    </main>
  );
}
