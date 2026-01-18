// components/Footer.tsx
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.footerTitulo}>Contáctanos</h2>

      <div className={styles.footerGrid}>
        {/* Correo */}
        <div className={styles.contactoBox}>
          <div className={styles.contactoItem}>
            <i className="bi bi-envelope-fill"></i>
            <a href="mailto:sitecorpac@corpac.pe" className={styles.link}>
              sitecorpac@corpac.pe
            </a>
          </div>
        </div>

        {/* Teléfono */}
        <div className={styles.contactoBox}>
          <div className={styles.contactoItem}>
            <i className="bi bi-telephone-fill"></i>
            <span>+51 987654321</span>
          </div>
        </div>

        {/* WhatsApp */}
        <div className={styles.contactoBox}>
            <div className={styles.contactoItem}>
                <i className="bi bi-whatsapp"></i>
                <a
                href="https://wa.me/+51940218125"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                >
                +51 987654321
                </a>
            </div>
            </div>

        {/* Facebook */}
        <div className={styles.contactoBox}>
          <div className={styles.contactoItem}>
            <i className="bi bi-facebook"></i>
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
    </footer>
  );
}
