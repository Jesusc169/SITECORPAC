import styles from "@/app/legislacion/estatuto/estatuto.module.css";

/* =========================
   TIPOS
========================= */
type Estatuto = {
  titulo: string;
  descripcion: string;
  enlace_pdf: string;
  imagen: string | null;
};

type EstatutoViewProps = {
  data: {
    estatuto: Estatuto | null;
  };
};

/* =========================
   VISTA
========================= */
export default function EstatutoView({ data }: Readonly<EstatutoViewProps>) {
  const { estatuto } = data;

  if (!estatuto) return null;

  return (
    <section className={styles.container}>
      {/* TÍTULO */}
      <h2 className={styles.titulo}>{estatuto.titulo}</h2>

      {/* CONTENIDO TEXTO + IMAGEN (MISMA FILA) */}
      <div className={styles.contenido}>
        {/* TEXTO */}
        <div className={styles.descripcion}>
          <p>{estatuto.descripcion}</p>
        </div>

        {/* IMAGEN (OPCIONAL DESDE BD) */}
        {estatuto.imagen && (
          <div className={styles.imagenWrapper}>
            <img
              src={estatuto.imagen}
              alt={estatuto.titulo}
              className={styles.imagen}
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* CTA PDF */}
      <div className={styles.cta}>
        <a
          href={estatuto.enlace_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          📄 Descargar el Estatuto del SITECORPAC
        </a>
      </div>
    </section>
  );
}
