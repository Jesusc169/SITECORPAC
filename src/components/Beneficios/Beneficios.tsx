import Icono, { type NombreIcono } from "@/components/Icono/Icono";
import s from "@/styles/Sitio.module.css";

const BENEFICIOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "balanza",
    titulo: "Asesoría legal",
    texto: "Acompañamiento en reclamos laborales, sanciones, despidos injustificados y defensa de los derechos del trabajador.",
  },
  {
    icono: "corazon",
    titulo: "Apoyo en casos especiales",
    texto: "Apoyo solidario en casos de fallecimiento, emergencias médicas y gestiones ante CORPAC.",
  },
  {
    icono: "dinero",
    titulo: "Préstamos por convenio",
    texto: "Acceso a préstamos con tasas preferenciales para apoyar el bienestar económico de nuestros afiliados.",
  },
  {
    icono: "megafono",
    titulo: "Ferias y campañas",
    texto: "Campañas de salud y ferias de productos a precios accesibles para los afiliados.",
  },
];

export default function Beneficios() {
  return (
    <section className={`${s.seccion} ${s.ben}`} aria-labelledby="titulo-beneficios">
      <div className={s.ancho}>
        <div className={s.sh}>
          <div>
            <span className={s.kick}>Para ti</span>
            <h2 id="titulo-beneficios">Beneficios para nuestros afiliados</h2>
          </div>
        </div>
        <ul className={s.benLista}>
          {BENEFICIOS.map((b) => (
            <li key={b.titulo}>
              <span className={s.ico}>
                <Icono nombre={b.icono} />
              </span>
              <h3>{b.titulo}</h3>
              <p>{b.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
