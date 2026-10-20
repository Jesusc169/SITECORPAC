import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Preguntas from "@/components/Sitio/Preguntas";
import BotonCopiar from "@/components/Sitio/BotonCopiar";
import Icono from "@/components/Icono/Icono";
import { ENLACES } from "@/lib/datosInstitucionales";
import { correoYAsunto, quitarVineta } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

interface Requisito {
  id: number
  descripcion: string
}

interface Faq {
  id: number
  pregunta: string
  respuesta: string
}

interface BeneficioFallecidoProps {
  titulo: string
  descripcion: string
  imagenHero?: string
  imagenRequisitos?: string
  requisitos: Requisito[]
  faqs: Faq[]
}

function PasoRequisito({ texto }: Readonly<{ texto: string }>) {
  const correo = correoYAsunto(texto);
  if (!correo) return <b>{quitarVineta(texto)}</b>;
  // "Enviar la sucesión intestada al correo … con asunto: …" → correo y
  // asunto aparte, con botón de copiar, para que no se escriban mal.
  return (
    <>
      <b>Enviar la sucesión intestada por correo</b>
      <span>Usa estos datos tal cual:</span>
      <div className={s.mailbox}>
        <div className={s.r}>
          <span>
            Para: <code>{correo.correo}</code>
          </span>
          <BotonCopiar texto={correo.correo} etiqueta="Copiar correo" />
        </div>
        <div className={s.r}>
          <span>
            Asunto: <code>{correo.asunto}</code>
          </span>
          <BotonCopiar texto={correo.asunto} etiqueta="Copiar asunto" />
        </div>
      </div>
    </>
  );
}

export default function BeneficioFallecidoView({
  descripcion,
  requisitos,
  faqs
}: Readonly<BeneficioFallecidoProps>) {
  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Trámites" }, { texto: "Beneficio por fallecimiento" }]}
        rotulo="Trámites"
        titulo="Beneficio por fallecimiento"
        entrada={descripcion}
      />

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={`${s.ancho} ${s.grid2}`}>
          <div>
            <span className={`${s.kick} ${s.h2k}`}>Paso a paso</span>
            <h2 className={s.h2}>Requisitos</h2>
            <ol className={s.steps}>
              {requisitos.map((r) => (
                <li key={r.id}>
                  <div>
                    <PasoRequisito texto={r.descripcion} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {/* Cifras resumidas de las preguntas frecuentes (beneficio_fallecido_faq). */}
          <aside className={s.facts} aria-label="Datos del beneficio">
            <div className={s.fact}>
              <span>Apoyo económico</span>
              <span className={s.big}>Hasta S/ 5,000</span>
              <span>Para la familia del afiliado.</span>
            </div>
            <div className={`${s.fact} ${s.factLight}`}>
              <span>Tiempo de trámite</span>
              <span className={s.big}>1 a 3 días hábiles</span>
            </div>
            <a className={s.cta} href={ENLACES.whatsappFallecimiento} target="_blank" rel="noopener noreferrer">
              <Icono nombre="telefono" chico />
              Consultar por WhatsApp
              <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
            </a>
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
