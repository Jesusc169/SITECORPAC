// components/Beneficios.tsx
import styles from "./Beneficios.module.css";

export default function Beneficios() {
  const beneficios = [
    {
      titulo: "Asesoría legal",
      descripcion:
        "Acompañamiento en reclamos laborales, sanciones, despidos injustificados y defensa de los derechos del trabajador.",
      icono: "bi bi-file-earmark-text",
    },
    {
      titulo: "Apoyo en casos especiales",
      descripcion:
        "Apoyo solidario en casos de fallecimiento, emergencias médicas y gestiones ante CORPAC.",
      icono: "bi bi-heart-pulse",
    },
    {
      titulo: "Préstamos por convenio",
      descripcion:
        "Acceso a préstamos con tasas preferenciales para apoyar el bienestar económico de nuestros afiliados.",
      icono: "bi bi-cash-coin",
    },
    {
      titulo: "Ferias y campañas",
      descripcion:
        "Organización de campañas de salud y ferias de productos a precios accesibles para los afiliados.",
      icono: "bi bi-megaphone",
    },
  ];

  return (
    <section className={styles.beneficiosSection}>
      <header className={styles.header}>
        <h2 className={styles.titulo}>Beneficios para nuestros afiliados</h2>
        <p className={styles.subtitulo}>
          Comprometidos con la defensa, el bienestar y el desarrollo de nuestros
          afiliados.
        </p>
      </header>

      <div className={styles.grid}>
        {beneficios.map((beneficio, index) => (
          <article key={index} className={styles.card}>
            <div className={styles.icono}>
              <i className={beneficio.icono} />
            </div>

            <div className={styles.contenido}>
              <h3 className={styles.cardTitulo}>{beneficio.titulo}</h3>
              <p className={styles.descripcion}>{beneficio.descripcion}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
