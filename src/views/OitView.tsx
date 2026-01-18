import styles from "@/app/legislacion/oit/oit.module.css";

/* =========================
   TIPOS
========================= */
type Contenido = {
  id: number;
  titulo: string;
  descripcion: string;
};

type OitViewProps = {
  data: {
    contenidos: Contenido[];
  };
};

/* =========================
   VISTA
========================= */
export default function OitView({ data }: OitViewProps) {
  const { contenidos } = data;

  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>
        Organización Internacional del Trabajo (OIT)
      </h2>

      {/* =========================
         CONTENIDO INSTITUCIONAL
      ========================= */}
      {contenidos.map((c, index) => (
        <div key={c.id} className={styles.bloque}>
          <div className="row align-items-center">
            {/* TEXTO */}
            <div className="col-md-7">
              <h4 className="fw-bold">{c.titulo}</h4>
              <p className={styles.descripcion}>{c.descripcion}</p>
            </div>

            {/* IMAGEN SEGÚN SECCIÓN */}
            {index === 0 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/oit/logo-oit.png"
                  alt="Logo de la Organización Internacional del Trabajo"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}

            {index === 1 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/oit/silueta-personas.jpg"
                  alt="Personas representando la inclusión y el trabajo digno"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}

            {index === 2 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/oit/trabajo-digno.jpg"
                  alt="Trabajo digno como principio fundamental de la OIT"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* =========================
         ENLACE OFICIAL OIT
      ========================= */}
      <div className={styles.cta}>
        <p className={styles.ctaTexto}>
          ¿Deseas conocer más sobre la Organización Internacional del Trabajo?
        </p>

        <a
          href="https://www.ilo.org"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          Conoce más sobre la OIT
        </a>
      </div>
    </section>
  );
}
