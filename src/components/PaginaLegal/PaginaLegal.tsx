import Link from "next/link";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { FECHA_POLITICAS } from "@/lib/datosInstitucionales";
import styles from "./PaginaLegal.module.css";

interface Seccion {
  id: string;
  titulo: string;
}

interface Props {
  titulo: string;
  resumen: string;
  secciones: Seccion[];
  children: React.ReactNode;
}

const PAGINAS_LEGALES = [
  { href: "/privacidad", texto: "Política de privacidad" },
  { href: "/terminos", texto: "Términos y condiciones" },
  { href: "/cookies", texto: "Política de cookies" },
  { href: "/accesibilidad", texto: "Accesibilidad" },
];

// Plantilla común de las páginas legales: título, resumen en lenguaje
// sencillo, índice con enlaces a cada sección y el texto completo. El índice
// también sirve a quien navega con teclado o lector de pantalla para saltar
// directo a la parte que le interesa.
export default function PaginaLegal({ titulo, resumen, secciones, children }: Readonly<Props>) {
  return (
    <>
      <Cabecera />
      <Navbar />
      <main className={styles.pagina}>
        <article className={styles.documento}>
          <header className={styles.encabezado}>
            <h1 className={styles.titulo}>{titulo}</h1>
            <p className={styles.fecha}>Última actualización: {FECHA_POLITICAS}</p>
            <p className={styles.resumen}>{resumen}</p>
          </header>

          <nav aria-labelledby="indice-titulo" className={styles.indice}>
            <h2 id="indice-titulo" className={styles.indiceTitulo}>
              Contenido
            </h2>
            <ol>
              {secciones.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.titulo}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.cuerpo}>{children}</div>

          <nav aria-label="Otras páginas legales" className={styles.relacionadas}>
            <ul>
              {PAGINAS_LEGALES.filter((p) => p.texto !== titulo).map((p) => (
                <li key={p.href}>
                  <Link href={p.href}>{p.texto}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}
