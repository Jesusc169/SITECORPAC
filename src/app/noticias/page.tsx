// src/app/noticias/page.tsx

// NoticiasController cachea 60s y se invalida al instante al
// publicar/editar/eliminar (revalidateTag("noticias")), así que ya no hace
// falta forzar esta página a renderizarse sin caché en cada visita.

import type { Metadata } from "next";
import { NoticiasController } from "@/controllers/noticiasController";
import NoticiasPageView from "@/views/NoticiasPageView";

export const metadata: Metadata = {
  title: "Noticias | SITECORPAC",
  description:
    "Actividades, comunicados y acciones del SITECORPAC en defensa de los trabajadores.",
};

// Componentes comunes
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default async function NoticiasPage() {
  const noticias = await NoticiasController.obtenerNoticias();

  // 🔁 Adaptador Server → Client (NO cambia lógica de negocio)
  const noticiasAdaptadas = noticias.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion,
    imagen: n.imagen,
    // n.fecha puede llegar como Date (cache miss) o string (cache hit:
    // unstable_cache lo serializa a JSON), así que no se puede asumir
    // que siempre trae .toISOString().
    fecha: typeof n.fecha === "string" ? n.fecha : n.fecha.toISOString(),
  }));

  return (
    <main>
      <Cabecera />
      <Navbar />
      <NoticiasPageView noticias={noticiasAdaptadas} />
      <Footer />
    </main>
  );
}