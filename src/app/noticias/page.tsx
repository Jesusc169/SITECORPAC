// src/app/noticias/page.tsx
import { NoticiasController } from "@/controllers/noticiasController";
import NoticiasPageView from "@/views/NoticiasPageView";

// Componentes comunes
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default async function NoticiasPage() {
  // 🟢 Obtenemos TODAS las noticias (histórico)
  const noticias = await NoticiasController.obtenerNoticias();

  return (
    <main>
      <Cabecera />
      <Navbar />
      <NoticiasPageView noticias={noticias} />
      <Footer />
    </main>
  );
}
