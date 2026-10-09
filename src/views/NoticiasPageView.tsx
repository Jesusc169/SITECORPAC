"use client";

import NoticiasGrid from "@/components/Noticias/NoticiasGrid";

interface NoticiaFromApi {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  fecha: string;
}

interface NoticiaView {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fechaPublicacion: string;
}

export default function NoticiasPageView({
  noticias,
}: Readonly<{
  noticias: NoticiaFromApi[];
}>) {
  // 🔁 Adaptador solo de presentación (no lógica de negocio)
  const noticiasView: NoticiaView[] = noticias.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion,
    imagen: n.imagen ?? "", // ✅ FIX: nunca null
    fechaPublicacion: n.fecha,
  }));

  return (
    <section style={{ padding: "3rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
        📰 Todas las Noticias
      </h1>

      <NoticiasGrid noticias={noticiasView} />
    </section>
  );
}
