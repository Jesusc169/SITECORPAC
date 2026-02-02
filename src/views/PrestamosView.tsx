"use client";

import styles from "@/app/tramites/prestamos/prestamos.module.css";

/* =========================
   TIPOS (alineados a Prisma)
   ========================= */
type Cooperativa = {
  id: number;
  nombre: string;
  logo: string | null; // 👈 Prisma permite null
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

/* =========================
   VISTA
   ========================= */
export default function PrestamosView({ data }: PrestamosViewProps) {
  const { cooperativas, requisitos, faqs } = data;

  return (
    <section className={styles.container}>
      {/* =========================
         TÍTULO
         ========================= */}
      <h2 className={styles.titulo}>
        Solicita préstamos a través de Cooperativas
      </h2>

      <p className={styles.descripcion}>
        Gracias al convenio con distintas cooperativas, los afiliados del
        SITECORPAC pueden acceder a préstamos con facilidades especiales,
        pensados para brindar apoyo económico y bienestar.
      </p>

      {/* =========================
         COOPERATIVAS
         ========================= */}
      <div className={`row ${styles.cooperativas}`}>
        {cooperativas.map((c) => (
          <div key={c.id} className="col-md-4 mb-4">
            <div className={styles.coopCard}>
              <img
                src={c.logo ?? "/images/cooperativas/default.png"} // 👈 fallback seguro
                alt={`Logo de ${c.nombre}`}
                className={`img-fluid ${styles.coopLogo}`}
                loading="lazy"
              />
              <p className="fw-semibold mt-2">{c.nombre}</p>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
         REQUISITOS
         ========================= */}
      <div className={styles.requisitos}>
        <h4 className="fw-bold">Requisitos</h4>

        <div className={`row ${styles.requisitosLayout}`}>
          {/* Imagen */}
          <div className="col-md-5">
            <img
              src="/images/prestamos/requisitos-prestamos.jpg"
              alt="Requisitos para acceder a préstamos"
              className={styles.requisitosImagen}
              loading="lazy"
            />
          </div>

          {/* Lista */}
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
      </div>

      {/* =========================
         FAQ
         ========================= */}
      <div className={styles.faq}>
        <h4 className="fw-bold mb-3">Preguntas frecuentes</h4>

        <div className="accordion" id="faqPrestamos">
          {faqs.map((faq, index) => (
            <div className="accordion-item mb-2" key={faq.id}>
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${
                    index !== 0 ? "collapsed" : ""
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
                  index === 0 ? "show" : ""
                }`}
                data-bs-parent="#faqPrestamos"
              >
                <div className="accordion-body">
                  {faq.respuesta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
