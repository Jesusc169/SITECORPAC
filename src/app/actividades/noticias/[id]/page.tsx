// app/actividades/noticias/[id]/page.tsx
import { NoticiasController } from "@/controllers/noticiasController";
import styles from "../[id]/Noticias.module.css"; // reutilizamos los estilos
import { notFound } from "next/navigation";

// Componentes globales
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

interface Props {
  params: { id: string };
}

export default async function NoticiaPage({ params }: Props) {
  const id = Number(params.id);

  if (isNaN(id)) {
    // Si el ID no es válido, mostramos página 404
    notFound();
  }

  const noticia = await NoticiasController.obtenerNoticiaPorId(id);

  if (!noticia) {
    // Si no existe la noticia, mostramos página 404
    notFound();
  }

  return (
    <>
      <Cabecera />
      {/* 🔹 Navbar al inicio de la página */}
      <Navbar />

      {/* 🔹 Contenido principal de la noticia */}
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
          Publicado el {new Date(noticia.fecha).toLocaleDateString()} por{" "}
          {noticia.autor}
        </p>

        <div className={styles.noticiaContenido}>
          {noticia.contenido ? (
            <p>{noticia.contenido}</p>
          ) : (
            <p>{noticia.descripcion}</p>
          )}
        </div>
      </main>

      {/* 🔹 Footer al final */}
      <Footer />
    </>
  );
}