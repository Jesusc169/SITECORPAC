// app/actividades/noticias/[id]/page.tsx
import Image from "next/image";
import { NoticiasController } from "@/controllers/noticiasController";
import styles from "./Noticias.module.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Componentes globales
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import GaleriaFotos from "@/components/GaleriaFotos/GaleriaFotos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const noticia = await NoticiasController.obtenerNoticiaPorId(Number(id));

  if (!noticia) {
    return { title: "Noticia no encontrada | SITECORPAC" };
  }

  const titulo = `${noticia.titulo} | SITECORPAC`;
  const descripcion = noticia.descripcion;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: noticia.imagen ? [noticia.imagen] : undefined,
    },
  };
}

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
          <div className={styles.noticiaImagenWrapper}>
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              sizes="(max-width: 600px) 100vw, 520px"
              className={styles.noticiaImagenPage}
            />
          </div>
        )}

        <p className={styles.noticiaMeta}>
          Publicado el{" "}
          {new Date(noticia.fecha).toLocaleDateString("es-PE")} por{" "}
          {noticia.autor}
        </p>

        <div className={styles.noticiaContenido}>
          <p>{noticia.contenido || noticia.descripcion}</p>
        </div>

        <GaleriaFotos
          imagenes={noticia.noticia_imagen
            .filter((img) => !img.principal)
            .map((img) => img.url)}
          titulo={noticia.titulo}
        />

        {noticia.noticia_pdf.length > 0 && (
          <div className={styles.noticiaPdfWrapper}>
            <p className={styles.noticiaPdfTitulo}>📎 Documentos adjuntos:</p>
            <ol className={styles.noticiaPdfLista}>
              {noticia.noticia_pdf.map((pdf) => (
                <li key={pdf.id} className={styles.noticiaPdfItem}>
                  {pdf.nombre}{" "}
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.noticiaPdfLink}
                  >
                    (descargar documento)
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
