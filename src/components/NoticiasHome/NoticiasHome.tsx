// "Lo último · Noticias" de la portada (rediseño A+C): una noticia destacada
// grande y las tres siguientes al costado. Reemplaza al carrusel de 18 s.
import Link from "next/link";
import Afiche from "@/components/Sitio/Afiche";
import Icono from "@/components/Icono/Icono";
import { fechaCorta } from "@/lib/fechas";
import s from "@/styles/Sitio.module.css";

export interface NoticiaResumen {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  fecha: string;
}

export default function NoticiasHome({ noticias }: Readonly<{ noticias: NoticiaResumen[] }>) {
  const [destacada, ...resto] = noticias;

  return (
    <section className={s.seccion} aria-labelledby="titulo-noticias">
      <div className={s.ancho}>
        <div className={s.sh}>
          <div>
            <span className={s.kick}>Lo último</span>
            <h2 id="titulo-noticias">Noticias</h2>
          </div>
          <Link className={s.more} href="/noticias">
            Ver todas <Icono nombre="flecha" chico />
          </Link>
        </div>

        {destacada ? (
          <div className={s.news}>
            <Link className={s.lead} href={`/actividades/noticias/${destacada.id}`}>
              <Afiche src={destacada.imagen} alt={destacada.titulo} prioridad />
              <span className={s.date}>{fechaCorta(destacada.fecha)}</span>
              <h3>{destacada.titulo}</h3>
              {destacada.descripcion && <p className={s.resumen}>{destacada.descripcion}</p>}
            </Link>
            <div className={s.side}>
              {resto.slice(0, 3).map((n) => (
                <Link key={n.id} href={`/actividades/noticias/${n.id}`}>
                  <Afiche src={n.imagen} alt={n.titulo} />
                  <div>
                    <p className={s.date}>{fechaCorta(n.fecha)}</p>
                    <h3>{n.titulo}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className={s.sinDatos}>No hay noticias disponibles en este momento.</p>
        )}
      </div>
    </section>
  );
}
