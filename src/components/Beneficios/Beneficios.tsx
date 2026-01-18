// components/Beneficios.tsx
import styles from "./Beneficios.module.css";

// Importa los íconos de Bootstrap (ya mencionaste que están importados)
export default function Beneficios() {
  const beneficios = [
    {
      titulo: "Asesoría legal",
      descripcion:
        "Te acompañamos en reclamos laborales, sanciones, despidos injustificados o cualquier afectación a los derechos del trabajador.",
      color: "azul",
      icono: "bi bi-file-earmark-text", // ícono de martillo (legal)
    },
    {
      titulo: "Apoyo en casos especiales",
      descripcion:
        "Bono a familiares por fallecimiento de colaborador por el sindicato, ayudas en casos médicos urgentes, y apoyos en gestiones ante CORPAC.",
      color: "gris",
      icono: "bi bi-heart-pulse", // ícono de salud / ayuda
    },
    {
      titulo: "Préstamos por convenio a bajo interés",
      descripcion:
        "Brindamos a nuestros afiliados préstamos para ayudarlos a cumplir sus metas.",
      color: "azul",
      icono: "bi bi-cash-coin", // ícono de dinero
    },
    {
      titulo: "Ferias y campañas",
      descripcion:
        "Organizamos campañas de salud y campañas de ventas de alimentos y productos a precios accesibles.",
      color: "gris",
      icono: "bi bi-megaphone", // ícono de evento / campaña
    },
  ];

  return (
    <section className={styles.beneficiosSection}>
      <h2 className={styles.beneficiosTitulo}>Beneficios para nuestros afiliados</h2>
      <div className={styles.beneficiosContainer}>
        {beneficios.map((beneficio, index) => (
          <div
            key={index}
            className={`${styles.beneficioCard} ${
              beneficio.color === "azul" ? styles.azul : styles.gris
            }`}
          >
            <div className={styles.beneficioContenido}>
              <div className={styles.beneficioTextoContainer}>
                <h3 className={styles.beneficioTitulo}>{beneficio.titulo}</h3>
                <p className={styles.beneficioTexto}>{beneficio.descripcion}</p>
              </div>
              <div className={styles.iconoContainer}>
                <i className={`${beneficio.icono} ${styles.beneficioIcono}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
