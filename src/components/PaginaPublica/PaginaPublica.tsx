// Esqueleto común de todas las páginas públicas: cabecera, contenido
// principal (destino de "Saltar al contenido principal"), Contáctanos + pie
// y el botón flotante de WhatsApp.
import type { ReactNode } from "react";
import Cabecera from "@/components/Cabecera/Cabecera";
import Footer from "@/components/Footer/Footer";
import WhatsAppIcon from "@/components/WhatsAppIcon/WhatsAppIcon";
import s from "@/styles/Sitio.module.css";

export default function PaginaPublica({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className={s.sitio}>
      <Cabecera />
      <main id="contenido" tabIndex={-1}>
        {children}
        <WhatsAppIcon />
      </main>
      <Footer />
    </div>
  );
}
