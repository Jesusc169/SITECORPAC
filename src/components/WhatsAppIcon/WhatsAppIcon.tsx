// components/WhatsAppIcon.tsx
import { getWhatsAppLink } from "../../controllers/contact.controller";
import styles from "./WhatsAppIcon.module.css";

export default function WhatsAppIcon() {
  const whatsappLink = getWhatsAppLink();

  return (
    <div className={styles.floatingContainer}>
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappButton}
      >
        <span className={styles.tooltipText}>Comunícate con el SITE</span>
        <i className="bi bi-whatsapp"></i>
      </a>
    </div>
  );
}
