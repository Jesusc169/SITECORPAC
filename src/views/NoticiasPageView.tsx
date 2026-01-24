"use client";

import NoticiasGrid from "@/components/Noticias/NoticiasGrid";

interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fechaPublicacion: string;
}

export default function NoticiasPageView({
  noticias,
}: {
  noticias: Noticia[];
}) {
  return (
    <section style={{ padding: "3rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
        📰 Todas las Noticias
      </h1>

      <NoticiasGrid noticias={noticias} />
    </section>
  );
}
