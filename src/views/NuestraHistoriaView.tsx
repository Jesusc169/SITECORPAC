// src/views/NuestraHistoriaView.tsx
import Link from "next/link";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Icono from "@/components/Icono/Icono";
import { ENLACES } from "@/lib/datosInstitucionales";
import s from "@/styles/Sitio.module.css";
import { NuestraHistoriaData } from "../models/NuestraHistoriaModel";

interface Props {
  data: NuestraHistoriaData;
}

export default function NuestraHistoriaView({ data }: Readonly<Props>) {
  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Quiénes somos" }, { texto: "Nuestra historia" }]}
        rotulo="Quiénes somos"
        titulo="Nuestra historia"
        // La introducción viene con saltos de línea y sangría del modelo.
        entrada={data.introduccion.replace(/\s+/g, " ").trim()}
      />

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={`${s.ancho} ${s.grid2}`}>
          <div>
            <span className={`${s.kick} ${s.h2k}`}>Línea de tiempo</span>
            <h2 className={s.h2}>De CORPAC a hoy</h2>
            <ol className={s.tl}>
              {data.eventos.map((evento, i) => (
                <li key={evento.año} className={i === data.eventos.length - 1 ? s.now : ""}>
                  <span className={s.y}>{evento.año}</span>
                  <p>{evento.descripcion}</p>
                </li>
              ))}
            </ol>
            <p className={s.note}>
              Los datos históricos de CORPAC están basados en registros públicos. La narrativa del
              sindicato puede estar sujeta a revisión institucional.
            </p>
          </div>

          <aside className={`${s.card} ${s.asideCard}`}>
            <div className={s.sideArt}>
              <img
                src="/images/portada/trabajadores-corpac.webp"
                alt="Ilustración de trabajadores de CORPAC abrazados frente a un aeropuerto"
                loading="lazy"
              />
            </div>
            <h3>Lo que nos guía</h3>
            <p>Organización sindical representativa, democrática y comprometida con sus afiliados.</p>
            <div className={s.vals}>
              {["Democracia", "Solidaridad", "Transparencia"].map((v) => (
                <span key={v}>
                  <Icono nombre="check" chico />
                  {v}
                </span>
              ))}
            </div>
            <Link className={s.ghost} href="/directorio">
              Conoce al directorio <Icono nombre="flecha" chico />
            </Link>
          </aside>
        </div>
      </section>

      <section className={`${s.seccion} ${s.tight} ${s.sinArriba}`}>
        <div className={s.ancho}>
          <div className={s.ctaband}>
            <div>
              <h2>¿Trabajas en CORPAC?</h2>
              <p>Súmate a la organización que defiende tu trabajo digno.</p>
            </div>
            <a className={s.cta} href={ENLACES.whatsappUnete} target="_blank" rel="noopener noreferrer">
              <Icono nombre="chat" chico />
              Únete al SITE
              <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
