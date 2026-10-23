// app/actividades/noticias/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NoticiasController } from "@/controllers/noticiasController";

// Componentes globales
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import Afiche from "@/components/Sitio/Afiche";
import BloquesTexto from "@/components/Sitio/BloquesTexto";
import Compartir from "@/components/Sitio/Compartir";
import Icono from "@/components/Icono/Icono";
import GaleriaFotos from "@/components/GaleriaFotos/GaleriaFotos";
import { fechaCorta } from "@/lib/fechas";
import { esHtml, textoABloques } from "@/lib/textoRico";
import { limpiarHtml } from "@/lib/htmlSeguro";
import { INSTITUCION } from "@/lib/datosInstitucionales";
import s from "@/styles/Sitio.module.css";

// La página se genera la primera vez que alguien abre cada noticia y se
// reutiliza; publicar/editar/eliminar la invalida al instante vía
// revalidateTag("noticias") (ver NoticiasController), y como respaldo se
// regenera cada 60s.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

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

function aTexto(fecha: string | Date) {
  return typeof fecha === "string" ? fecha : fecha.toISOString();
}

export default async function NoticiaPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const noticiaId = Number(id);

  // ID inválido
  if (isNaN(noticiaId)) {
    notFound();
  }

  const noticia = await NoticiasController.obtenerNoticiaPorId(noticiaId);

  // Noticia no encontrada
  if (!noticia) {
    notFound();
  }

  const otras = (await NoticiasController.obtenerNoticias()).filter((n) => n.id !== noticia.id).slice(0, 3);
  // Sin contenido (o vacío) se muestra la descripción.
  const cuerpo = noticia.contenido?.trim() ? noticia.contenido : noticia.descripcion;
  // Texto con formato del editor (limpio) o texto plano de antes, en bloques.
  const html = esHtml(cuerpo) ? limpiarHtml(cuerpo) : null;
  const bloques = html === null ? textoABloques(cuerpo) : [];
  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? INSTITUCION.sitio}/actividades/noticias/${noticia.id}`;

  return (
    <PaginaPublica>
      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          <article className={s.articulo}>
            <nav className={s.crumb} aria-label="Ruta">
              <Link href="/">Inicio</Link> › <Link href="/noticias">Noticias</Link> ›{" "}
              <span aria-current="page">{noticia.titulo}</span>
            </nav>
            <Link className={s.back} href="/noticias">
              <Icono nombre="flecha" chico />
              Volver a noticias
            </Link>
            <p className={s.date}>
              {fechaCorta(noticia.fecha)}
              {noticia.autor ? ` · ${noticia.autor}` : ""}
            </p>
            <h1>{noticia.titulo}</h1>
            {noticia.imagen && <Afiche src={noticia.imagen} alt={noticia.titulo} prioridad />}

            <div className={s.body}>
              {html === null ? (
                <BloquesTexto bloques={bloques} />
              ) : (
                <div className={s.rico} dangerouslySetInnerHTML={{ __html: html }} />
              )}

              <GaleriaFotos
                imagenes={noticia.noticia_imagen.filter((img) => !img.principal).map((img) => img.url)}
                titulo={noticia.titulo}
              />

              {noticia.noticia_pdf.map((pdf) => (
                <div key={pdf.id} className={s.att}>
                  <span className={s.fi}>
                    <Icono nombre="documento" />
                  </span>
                  <div>
                    <b>{pdf.nombre}</b>
                    <span>Documento adjunto</span>
                  </div>
                  <a className={s.cta} href={pdf.url} target="_blank" rel="noopener noreferrer">
                    <Icono nombre="descargar" chico />
                    Descargar
                    <span className="sr-only"> {pdf.nombre} (abre en una pestaña nueva)</span>
                  </a>
                </div>
              ))}

              <Compartir url={url} titulo={noticia.titulo} />
            </div>
          </article>
        </div>
      </section>

      {otras.length > 0 && (
        <section className={`${s.seccion} ${s.tight} ${s.gris}`} aria-labelledby="titulo-mas-noticias">
          <div className={s.ancho}>
            <div className={s.sh}>
              <div>
                <span className={s.kick}>Lo último</span>
                <h2 id="titulo-mas-noticias">Más noticias</h2>
              </div>
              <Link className={s.more} href="/noticias">
                Ver todas <Icono nombre="flecha" chico />
              </Link>
            </div>
            <div className={s.more3}>
              {otras.map((n) => (
                <Link key={n.id} className={s.nc} href={`/actividades/noticias/${n.id}`}>
                  <Afiche src={n.imagen} alt={n.titulo} />
                  <p className={s.date}>{fechaCorta(aTexto(n.fecha))}</p>
                  <h3>{n.titulo}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PaginaPublica>
  );
}
