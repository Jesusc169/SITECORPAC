// app/actividades/noticias/[id]/page.tsx
import { NoticiasController } from "@/controllers/noticiasController";
import styles from "./Noticias.module.css";
import { notFound } from "next/navigation";

// Componentes globales
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noticiaId = Number(id);

  // 🔴 ID inválido
  if (isNaN(noticiaId)) {
    notFound();
  }

  const noticia = await NoticiasController.obtenerNoticiaPorId(noticiaId);

  // 🔴 Noticia no encontrada
  if (!noticia) {
    notFound();
  }

  return (
    <>
      <Cabecera />
      <Navbar />

      <main className={styles.noticiaPageContainer}>
        <h1 className={styles.noticiaTituloPage}>{noticia.titulo}</h1>

        {noticia.imagen && (
          <img
            src={noticia.imagen}
            alt={noticia.titulo}
            className={styles.noticiaImagenPage}
          />
        )}

        <p className={styles.noticiaMeta}>
          Publicado el{" "}
          {new Date(noticia.fecha).toLocaleDateString("es-PE")} por{" "}
          {noticia.autor}
        </p>

        <div className={styles.noticiaContenido}>
          <p>{noticia.contenido || noticia.descripcion}</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
