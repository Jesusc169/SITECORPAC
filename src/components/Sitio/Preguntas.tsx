import s from "@/styles/Sitio.module.css";

/** Preguntas frecuentes con <details>: funciona sin JavaScript y con teclado. */
export default function Preguntas({
  faqs,
}: Readonly<{ faqs: { id: number; pregunta: string; respuesta: string }[] }>) {
  return (
    <div className={s.faq}>
      {faqs.map((f, i) => (
        <details key={f.id} open={i === 0}>
          <summary>{f.pregunta}</summary>
          <p>{f.respuesta}</p>
        </details>
      ))}
    </div>
  );
}
