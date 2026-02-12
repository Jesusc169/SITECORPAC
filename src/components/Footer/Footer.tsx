// components/Footer.tsx
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* CABECERA */}
        <header className={styles.header}>
          <h2 className={styles.titulo}>Contáctanos</h2>
          <p className={styles.descripcion}>
            Estamos disponibles para atender consultas, brindar información
            institucional y acompañar a nuestros afiliados.
          </p>
        </header>

        {/* GRID DE CONTACTO */}
        <div className={styles.grid}>
          {/* Email */}
          <div className={styles.card}>
            <i className="bi bi-envelope-fill"></i>
            <div>
              <span className={styles.label}>Correo institucional</span>
              <a
                href="mailto:sitecorpac@corpac.pe"
                className={styles.link}
              >
                sitecorpac@corpac.pe
              </a>
            </div>
          </div>

          {/* Teléfono */}
          <div className={styles.card}>
            <i className="bi bi-telephone-fill"></i>
            <div>
              <span className={styles.label}>Teléfono</span>
              <span className={styles.text}>+51 950215616</span>
            </div>
          </div>

          {/* WhatsApp */}
          <div className={styles.card}>
            <i className="bi bi-whatsapp"></i>
            <div>
              <span className={styles.label}>WhatsApp</span>
              <a
                href="https://wa.me/51950215616"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                +51 950215616
              </a>
            </div>
          </div>

          {/* Facebook */}
          <div className={styles.card}>
            <i className="bi bi-facebook"></i>
            <div>
              <span className={styles.label}>Facebook</span>
              <a
                href="https://www.facebook.com/SITECORPAC"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                SITECORPAC
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER LEGAL */}
        <div className={styles.footerBottom}>
          <p>
            © {new Date().getFullYear()} SITECORPAC — Sindicato de Trabajadores de CORPAC
          </p>
        </div>
      </div>
    </footer>
  );
}
