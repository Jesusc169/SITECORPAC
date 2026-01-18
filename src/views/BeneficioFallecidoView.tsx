import styles from '@/app/tramites/beneficio-fallecido/beneficio-fallecido.module.css'

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

export default function BeneficioFallecidoView({
  titulo,
  descripcion,
  imagenHero,
  imagenRequisitos,
  requisitos,
  faqs
}: BeneficioFallecidoProps) {
  return (
    <section className={styles.container}>
      {/* =====================
          TÍTULO
      ===================== */}
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.descripcion}>{descripcion}</p>

      

      {/* =====================
          REQUISITOS
      ===================== */}
      <section className={styles.requisitos}>
        

        <h2 className="fw-bold">Requisitos</h2>

        <div className={`row ${styles.requisitosLayout}`}>
          {/* Imagen a la izquierda */}
            <div className="col-md-5">
            <img
                src="/images/beneficios/requisito-beneficio-fallecido.jpeg"
                alt="Beneficio por fallecimiento"
                className={styles.heroImage}
            />
            </div>

          {/* Lista a la derecha */}
            <div className="col-md-7">
            <ul className="list-group list-group-flush">
                {requisitos.map((r) => (
                <li key={r.id} className="list-group-item">
                    {r.descripcion}
                </li>
                ))}
            </ul>
            </div>
        </div>
      </section>

      {/* =====================
          FAQ
      ===================== */}
      <section className={styles.faqs}>
        <h2 className="fw-bold mb-3">Preguntas frecuentes</h2>

        <div className="accordion" id="faqBeneficio">
          {faqs.map((faq, index) => (
            <div className="accordion-item mb-2" key={faq.id}>
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${
                    index !== 0 ? 'collapsed' : ''
                  }`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#faq-${faq.id}`}
                  aria-expanded={index === 0}
                  aria-controls={`faq-${faq.id}`}
                >
                  {faq.pregunta}
                </button>
              </h2>

              <div
                id={`faq-${faq.id}`}
                className={`accordion-collapse collapse ${
                  index === 0 ? 'show' : ''
                }`}
                data-bs-parent="#faqBeneficio"
              >
                <div className="accordion-body">
                  {faq.respuesta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
