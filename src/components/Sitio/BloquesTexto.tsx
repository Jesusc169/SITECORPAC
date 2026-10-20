import Icono from "@/components/Icono/Icono";
import type { Bloque } from "@/lib/textoRico";
import s from "@/styles/Sitio.module.css";

/** Pinta los bloques de lib/textoRico: párrafos, listas con check y artículos. */
export default function BloquesTexto({ bloques }: Readonly<{ bloques: Bloque[] }>) {
  return (
    <>
      {bloques.map((b, i) => {
        if (b.tipo === "parrafo") return <p key={i}>{b.texto}</p>;
        if (b.tipo === "lista")
          return (
            <ul key={i} className={s.lista}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Icono nombre="check" chico />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        return (
          <ul key={i} className={s.arts}>
            {b.items.map((a) => (
              <li key={a.articulo} className={a.destacado ? s.hl : ""}>
                <span className={s.an}>{a.articulo}</span>
                <h3>{a.titulo}</h3>
                <p>{a.texto}</p>
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}
