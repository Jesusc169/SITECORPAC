import Link from "next/link";
import Icono from "@/components/Icono/Icono";
import { MENU } from "@/components/Cabecera/menu";
import s from "@/styles/Sitio.module.css";

const COLUMNAS = [
  {
    titulo: "Base legal",
    texto: "Nuestra organización se sustenta en el marco jurídico vigente.",
    puntos: ["Constitución Política", "Ley N.º 728", "Registro oficial"],
  },
  {
    titulo: "Principios institucionales",
    texto: "Valores que guían nuestras acciones y decisiones.",
    puntos: ["Democracia", "Solidaridad", "Transparencia"],
  },
  {
    titulo: "Estructura organizacional",
    texto: "Organización clara y orientada al servicio sindical.",
    puntos: ["Estatuto aprobado", "Estructura definida", "Funciones sindicales"],
  },
];

export default function Fundamento() {
  const legislacion = MENU.find((g) => g.titulo === "Legislación laboral")!;

  return (
    <section className={s.seccion} aria-labelledby="titulo-fundamento">
      <div className={s.ancho}>
        <div className={s.sh}>
          <div>
            <span className={s.kick}>Quiénes somos</span>
            <h2 id="titulo-fundamento">Fundamento sindical</h2>
          </div>
        </div>
        <div className={s.cols}>
          {COLUMNAS.map((c) => (
            <div key={c.titulo} className={s.col}>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
              <ul>
                {c.puntos.map((p) => (
                  <li key={p}>
                    <Icono nombre="check" chico />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <nav className={s.legis} aria-label="Legislación laboral">
          <b>Legislación laboral:</b>
          {legislacion.enlaces.map((e) => (
            <Link key={e.href} href={e.href}>
              {e.texto}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
