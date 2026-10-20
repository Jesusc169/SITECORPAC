import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Preguntas from "@/components/Sitio/Preguntas";
import Icono from "@/components/Icono/Icono";
import { ENLACES } from "@/lib/datosInstitucionales";
import { quitarVineta } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

/* =========================
   TIPOS (alineados a Prisma)
   ========================= */
type Cooperativa = {
  id: number;
  nombre: string;
  logo: string | null;
};

type Requisito = {
  id: number;
  descripcion: string;
};

type Faq = {
  id: number;
  pregunta: string;
  respuesta: string;
};

type PrestamosViewProps = {
  data: {
    cooperativas: Cooperativa[];
    requisitos: Requisito[];
    faqs: Faq[];
  };
};

/** "…si aún no lo estás, únete aquí" → el "únete aquí" pasa a ser un enlace. */
function TextoRequisito({ texto }: Readonly<{ texto: string }>) {
  const limpio = quitarVineta(texto);
  const i = limpio.toLowerCase().indexOf("únete aquí");
  if (i === -1) return <b>{limpio}</b>;
  return (
    <b>
      {limpio.slice(0, i)}
      <a className={s.lk} href={ENLACES.whatsappUnete} target="_blank" rel="noopener noreferrer">
        {limpio.slice(i, i + "únete aquí".length)}
        <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
      </a>
      {limpio.slice(i + "únete aquí".length)}
    </b>
  );
}

/* =========================
   VISTA
   ========================= */
export default function PrestamosView({ data }: Readonly<PrestamosViewProps>) {
  const { cooperativas, requisitos, faqs } = data;

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Trámites" }, { texto: "Préstamos" }]}
        rotulo="Trámites"
        titulo="Préstamos"
        entrada="Gracias al convenio con distintas cooperativas, los afiliados del SITECORPAC pueden acceder a préstamos con facilidades especiales, pensados para brindar apoyo económico y bienestar."
      >
        <div className={s.btns}>
          <a className={s.cta} href={ENLACES.whatsappPrestamo} target="_blank" rel="noopener noreferrer">
            <Icono nombre="chat" chico />
            Solicitar por WhatsApp
            <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
          </a>
          <a className={s.ghost} href="#requisitos">
            Ver requisitos <Icono nombre="flecha" chico />
          </a>
        </div>
      </EncabezadoPagina>

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          <span className={`${s.kick} ${s.h2k}`}>Convenios</span>
          <h2 className={s.h2}>Cooperativas en convenio</h2>
          <ul className={s.coops}>
            {cooperativas.map((c) => (
              <li key={c.id}>
                <img
                  src={c.logo ?? "/images/cooperativas/default.png"}
                  alt={`Logo de ${c.nombre}`}
                  loading="lazy"
                />
                <b>{c.nombre}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${s.seccion} ${s.tight} ${s.sinArriba}`} id="requisitos">
        <div className={`${s.ancho} ${s.grid2}`}>
          <div>
            <span className={`${s.kick} ${s.h2k}`}>Paso a paso</span>
            <h2 className={s.h2}>Requisitos</h2>
            <ol className={s.steps}>
              {requisitos.map((r) => (
                <li key={r.id}>
                  <div>
                    <TextoRequisito texto={r.descripcion} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {/* Cifras resumidas de las preguntas frecuentes (tabla prestamo_faq). */}
          <aside className={s.facts} aria-label="Datos del préstamo">
            <div className={s.fact}>
              <span>Montos máximos</span>
              <span className={s.big}>S/ 20,000 – 80,000</span>
              <span>Previa evaluación crediticia.</span>
            </div>
            <div className={`${s.fact} ${s.factLight}`}>
              <span>Plazos</span>
              <span className={s.big}>Desde 3 meses</span>
              <span>Hasta planes mayores, según el tipo de préstamo.</span>
            </div>
          </aside>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className={`${s.seccion} ${s.tight} ${s.sinArriba}`}>
          <div className={s.ancho}>
            <div className={s.estrecho}>
              <span className={`${s.kick} ${s.h2k}`}>Dudas</span>
              <h2 className={s.h2}>Preguntas frecuentes</h2>
              <Preguntas faqs={faqs} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
