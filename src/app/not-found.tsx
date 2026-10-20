import type { Metadata } from "next";
import Link from "next/link";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página no encontrada | SITECORPAC",
};

export default function NotFound() {
  return (
    <PaginaPublica>
      <div className={styles.container}>
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
      </div>
    </PaginaPublica>
  );
}
