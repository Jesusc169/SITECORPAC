// Pie del rediseño A+C: franja "Contáctanos" (azul marino) + pie con
// accesos, datos legales y enlaces a las políticas.
import Link from "next/link";
import { ENLACES, INSTITUCION } from "@/lib/datosInstitucionales";
import { MENU } from "@/components/Cabecera/menu";
import s from "@/styles/Sitio.module.css";

export default function Footer() {
  const [quienes, tramites, actividades] = MENU;

  return (
    <>
      <section className={s.contact} aria-labelledby="titulo-contacto">
        <div className={`${s.ancho} ${s.contactGrid}`}>
          <div>
            <h2 id="titulo-contacto">Contáctanos</h2>
            <p>
              Estamos disponibles para atender consultas, brindar información
              institucional y acompañar a nuestros afiliados.
            </p>
          </div>
          <ul>
            <li>
              <span>Correo</span>
              <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a>
            </li>
            <li>
              <span>Teléfono y WhatsApp</span>
              <a href={ENLACES.whatsappUnete.split("?")[0]} target="_blank" rel="noopener noreferrer">
                {INSTITUCION.telefono}
                <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
              </a>
            </li>
            <li>
              <span>Facebook</span>
              <a href={ENLACES.facebook} target="_blank" rel="noopener noreferrer">
                SITECORPAC
                <span className="sr-only"> (abre Facebook en una pestaña nueva)</span>
              </a>
            </li>
          </ul>
        </div>
      </section>

      <footer className={s.pie}>
        <div className={s.ancho}>
          <div className={s.pieGrid}>
            <div>
              <div className={s.fbrand}>
                <img src="/logo_site.jpg" alt="" width={46} height={46} />
                <b>SITECORPAC</b>
              </div>
              <p className={s.pieLema}>
                Organización sindical representativa, democrática y comprometida
                con sus afiliados.
              </p>
            </div>
            {[quienes, tramites, actividades].map((g) => (
              <nav key={g.titulo} aria-label={g.titulo}>
                <h2>{g.titulo}</h2>
                <ul>
                  {g.enlaces.map((e) => (
                    <li key={e.href}>
                      <Link href={e.href}>{e.texto}</Link>
                    </li>
                  ))}
                  {g === actividades && (
                    <li>
                      <Link href="/noticias">Noticias</Link>
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>

          <div className={s.legal}>
            <span>
              © {new Date().getFullYear()} {INSTITUCION.razonSocial} · RUC {INSTITUCION.ruc}
            </span>
            <nav aria-label="Información legal">
              <ul>
                <li><Link href="/privacidad">Privacidad</Link></li>
                <li><Link href="/terminos">Términos</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
                <li><Link href="/accesibilidad">Accesibilidad</Link></li>
                <li>
                  <a href={ENLACES.soporteTecnico} target="_blank" rel="noopener noreferrer">
                    Soporte técnico
                    <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
