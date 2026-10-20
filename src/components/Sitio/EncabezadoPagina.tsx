import type { ReactNode } from "react";
import Link from "next/link";
import s from "@/styles/Sitio.module.css";

type Miga = { texto: string; href?: string };

/** Cabecera de página interior: ruta (migas), rótulo, título y entrada. */
export default function EncabezadoPagina({
  migas,
  rotulo,
  titulo,
  entrada,
  lateral,
  children,
}: Readonly<{
  migas: Miga[];
  rotulo: string;
  titulo: string;
  entrada?: ReactNode;
  /** Imagen pequeña a la derecha (p. ej. el escudo en la Constitución). */
  lateral?: ReactNode;
  children?: ReactNode;
}>) {
  return (
    <section className={s.phero}>
      <div className={`${s.ancho} ${s.pheroIn} ${lateral ? s.split : ""}`}>
        <div>
          <nav className={s.crumb} aria-label="Ruta">
            <Link href="/">Inicio</Link>
            {migas.map((m) => (
              <span key={m.texto}>
                ›{" "}
                {m.href ? (
                  <Link href={m.href}>{m.texto}</Link>
                ) : (
                  <span aria-current="page">{m.texto}</span>
                )}
              </span>
            ))}
          </nav>
          <span className={s.kick}>{rotulo}</span>
          <h1>{titulo}</h1>
          {entrada && <p className={s.lead}>{entrada}</p>}
          {children}
        </div>
        {lateral}
      </div>
    </section>
  );
}
