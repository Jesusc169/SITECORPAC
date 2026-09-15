"use client";

import { useEffect, useRef, useState } from "react";
import { getWhatsAppLink } from "@/controllers/contact.controller";
import styles from "./WhatsAppIcon.module.css";

export default function WhatsAppIcon() {
  const whatsappLink = getWhatsAppLink();
  const [sobreFooter, setSobreFooter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSobreFooter(entry.isIntersecting),
      { rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.floatingContainer} ${
        sobreFooter ? styles.desplazado : ""
      }`}
    >
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
