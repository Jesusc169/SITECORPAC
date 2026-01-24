import styles from "@/app/legislacion/ley-relaciones/ley-relaciones.module.css";

interface Props {
  data: {
    ley: {
      titulo: string;
      descripcion: string;
      imagen?: string | null;
      enlace_pdf: string;
    } | null;
  };
}

export default function LeyRelacionesView({ data }: Props) {
  if (!data.ley) {
    return <p style={{ padding: "3rem", textAlign: "center" }}>Contenido no disponible</p>;
  }

  const { titulo, descripcion, imagen, enlace_pdf } = data.ley;

  return (
    <section className={styles.container}>
      <h1 className={styles.titulo}>{titulo}</h1>

      <div className={styles.contenido}>
        <p className={styles.descripcion}>{descripcion}</p>

        {imagen && (
          <div className={styles.imagenWrapper}>
            <img src={imagen} alt={titulo} className={styles.imagen} />
          </div>
        )}
      </div>

      <div className={styles.cta}>
        <a
          href={enlace_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          📄 Descarga la ley de relaciones colectivas de trabajo
        </a>
      </div>
    </section>
  );
}
