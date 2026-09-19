"use client";

import { useEffect } from "react";
import Link from "next/link";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./error.module.css";

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Cabecera />
      <Navbar />

      <main className={styles.container}>
        <p className={styles.codigo}>Ocurrió un error</p>
        <h1 className={styles.titulo}>Algo no salió bien</h1>
        <p className={styles.texto}>
          Ya se registró el problema. Puedes intentar de nuevo o volver al
          inicio.
        </p>
        <div className={styles.acciones}>
          <button className={styles.btnPrimario} onClick={() => reset()}>
            Reintentar
          </button>
          <Link href="/" className={styles.btnSecundario}>
            Ir al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
