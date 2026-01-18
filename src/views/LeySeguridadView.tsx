import styles from "@/app/legislacion/ley-seguridad/ley-seguridad.module.css";

/* =========================
   TIPOS
========================= */
type Contenido = {
  id: number;
  titulo: string;
  descripcion: string;
  imagen?: string | null;
};

type LeySeguridadViewProps = {
  data: {
    contenidos: Contenido[];
  };
};

/* =========================
   VISTA
========================= */
export default function LeySeguridadView({ data }: LeySeguridadViewProps) {
  const { contenidos } = data;

  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>
        Ley de Seguridad y Salud en el Trabajo
      </h2>

      {contenidos.map((c) => (
        <div key={c.id} className={styles.bloque}>
          <div className="row align-items-center">
            {/* TEXTO */}
            <div className="col-md-7">
              <h4 className="fw-semibold">{c.titulo}</h4>

              <p className={styles.descripcion}>
                {c.descripcion}
              </p>
            </div>

            {/* IMAGEN DESDE MYSQL */}
            {c.imagen && (
              <div className="col-md-5 text-center">
                <img
                  src={c.imagen}
                  alt={c.titulo}
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaTexto}>
          Conoce el marco legal que protege la seguridad y salud de los
          trabajadores en el Perú.
        </p>

        <a
          href="https://www.gob.pe/institucion/mtpe/normas-legales"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          Ver normativa oficial
        </a>
      </div>
    </section>
  );
}
