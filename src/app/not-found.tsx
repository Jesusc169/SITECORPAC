import type { Metadata } from "next";
import Link from "next/link";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página no encontrada | SITECORPAC",
};

export default function NotFound() {
  return (
    <>
      <Cabecera />
      <Navbar />

      <main className={styles.container}>
        <p className={styles.codigo}>404</p>
        <h1 className={styles.titulo}>No encontramos esta página</h1>
        <p className={styles.texto}>
          El enlace puede estar roto o la página fue movida. Prueba volver al
          inicio o revisar las noticias más recientes.
        </p>
        <div className={styles.acciones}>
          <Link href="/" className={styles.btnPrimario}>
            Ir al inicio
          </Link>
          <Link href="/noticias" className={styles.btnSecundario}>
            Ver noticias
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
