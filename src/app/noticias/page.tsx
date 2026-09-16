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
    fecha: n.fecha.toISOString(), // ✅ Date → string
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