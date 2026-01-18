import styles from "@/app/legislacion/constitucion/constitucion.module.css";

/* =========================
   TIPOS
========================= */
type Contenido = {
  id: number;
  titulo: string;
  descripcion: string;
};

/* =========================
   PROPS
========================= */
type ConstitucionViewProps = {
  data: {
    contenidos: Contenido[];
  };
};

/* =========================
   VISTA
========================= */
export default function ConstitucionView({ data }: ConstitucionViewProps) {
  const { contenidos } = data;

  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>
        Constitución Política del Perú
      </h2>

      {/* =========================
         CONTENIDO CONSTITUCIONAL
      ========================= */}
      {contenidos.map((c, index) => (
        <div key={c.id} className={styles.bloque}>
          <div className="row align-items-center">
            {/* TEXTO */}
            <div className="col-md-7">
              <h4>{c.titulo}</h4>
              <p className={styles.descripcion}>{c.descripcion}</p>
            </div>

            {/* IMAGEN SEGÚN SECCIÓN */}
            {index === 0 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/constitucion/escudo-nacional.png"
                  alt="Escudo Nacional del Perú"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}

            {index === 1 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/constitucion/derechos-laborales.jpg"
                  alt="Derechos laborales reconocidos por la Constitución"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}

            {index === 2 && (
              <div className="col-md-5 text-center">
                <img
                  src="/images/constitucion/defensa-trabajo.jpeg"
                  alt="SITECORPAC y la defensa del trabajo digno"
                  className={styles.imagen}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* =========================
         CTA – CONSTITUCIÓN
      ========================= */}
      <div className={styles.cta}>
        <p className={styles.ctaTexto}>
          La Constitución Política del Perú es la norma suprema que garantiza
          los derechos fundamentales y regula la organización del Estado.
        </p>

        <a
          href="https://www.gob.pe/institucion/presidencia/informes-publicaciones/196158-constitucion-politica-del-peru"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          Consultar Constitución del Perú
        </a>
      </div>
    </section>
  );
}
