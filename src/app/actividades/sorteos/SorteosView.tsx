import Link from "next/link";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Afiche from "@/components/Sitio/Afiche";
import Icono from "@/components/Icono/Icono";
import GaleriaBoton from "@/components/GaleriaFotos/GaleriaBoton";
import { fechaCorta, formatearFechaHoraPeru } from "@/lib/fechas";
import s from "@/styles/Sitio.module.css";

interface SorteoProducto {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  cantidad?: number | null;
}

interface SorteoImagen {
  id: number;
  url: string;
  principal: boolean;
}

export interface Sorteo {
  id: number;
  nombre: string;
  descripcion: string;
  imagen?: string | null;
  lugar: string;
  fecha_hora: string;
  anio: number;

  // soporta ambas formas (backend viejo o nuevo)
  sorteo_producto?: SorteoProducto[];
  premios?: SorteoProducto[];
  sorteo_imagen?: SorteoImagen[];
}

export interface NoticiaMini {
  id: number;
  titulo: string;
  imagen: string | null;
  fecha: string;
}

interface Props {
  sorteos: Sorteo[];
  hayAnteriores: boolean;
  cargando: boolean;
  onChangeAnio: (anio: number | null) => void;
  aniosDisponibles: number[];
  anioSeleccionado: number | null;
  noticia: NoticiaMini | null;
}

function TarjetaSorteo({ sorteo }: Readonly<{ sorteo: Sorteo }>) {
  const productos = sorteo.sorteo_producto ?? sorteo.premios ?? [];
  const fecha = new Date(sorteo.fecha_hora);
  const fechaValida = !isNaN(fecha.getTime());
  const fotos = (sorteo.sorteo_imagen ?? []).map((i) => i.url);

  return (
    <article className={s.feria}>
      <div>
        <Afiche src={sorteo.imagen} alt={sorteo.nombre} />
        <div className={s.galeria}>
          <GaleriaBoton imagenes={fotos} titulo={sorteo.nombre} className={s.chip} />
        </div>
      </div>
      <div>
        {fechaValida && (
          <span className={`${s.badge} ${fecha.getTime() < Date.now() ? s.badgePast : ""}`}>
            <Icono nombre="calendario" chico />
            {formatearFechaHoraPeru(fecha, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
        <h3>{sorteo.nombre}</h3>
        {sorteo.descripcion && <p className={s.texto}>{sorteo.descripcion}</p>}
        <ul className={s.sched}>
          <li>
            <span>
              <Icono nombre="ubicacion" chico />
              {sorteo.lugar?.trim() || "Lugar no especificado"}
            </span>
          </li>
        </ul>
        {productos.length > 0 && (
          <>
            <p className={s.lbl}>Premios</p>
            <ul className={s.premios}>
              {productos.map((p, i) => (
                <li key={p.id ?? `prod-${sorteo.id}-${i}`}>
                  <Icono nombre="regalo" chico />
                  {p.nombre}
                  {p.cantidad ? ` (${p.cantidad})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}

function tituloVacio(anio: number | null, anioActual: number) {
  if (anio === null) return "Aún no hay sorteos publicados";
  if (anio === anioActual) return "Aún no hay sorteos este año";
  return `No hubo sorteos en ${anio}`;
}

export default function SorteosView({
  sorteos,
  hayAnteriores,
  cargando,
  onChangeAnio,
  aniosDisponibles,
  anioSeleccionado,
  noticia,
}: Readonly<Props>) {
  const anioActual = new Date().getFullYear();

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Actividades" }, { texto: "Sorteos" }]}
        rotulo="Actividades"
        titulo="Sorteos"
        entrada="En fechas como Fiestas Patrias y Navidad sorteamos premios entre los afiliados."
      >
        <fieldset className={s.chips} aria-label="Filtrar sorteos por año">
          {aniosDisponibles.map((anio) => (
            <button
              key={`anio-${anio}`}
              type="button"
              onClick={() => onChangeAnio(anio)}
              className={`${s.chip} ${anioSeleccionado === anio ? s.chipOn : ""}`}
              aria-pressed={anioSeleccionado === anio}
            >
              {anio}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChangeAnio(null)}
            className={`${s.chip} ${anioSeleccionado === null ? s.chipOn : ""}`}
            aria-pressed={anioSeleccionado === null}
          >
            Ver todos
          </button>
        </fieldset>
      </EncabezadoPagina>

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          {cargando && <p className={s.estado}>Cargando sorteos…</p>}

          {!cargando && sorteos.length > 0 && <h2 className="sr-only">Listado de sorteos</h2>}
          {!cargando && sorteos.map((sorteo) => <TarjetaSorteo key={sorteo.id} sorteo={sorteo} />)}

          {!cargando && sorteos.length === 0 && (
            <>
              <div className={s.empty}>
                <span className={s.big}>
                  <Icono nombre="regalo" />
                </span>
                <h2>{tituloVacio(anioSeleccionado, anioActual)}</h2>
                <p>
                  Cuando se anuncie el próximo, lo verás aquí y en Noticias.
                  {hayAnteriores && anioSeleccionado !== null && " Mientras tanto, revisa los sorteos de años anteriores."}
                </p>
                <div className={s.btns}>
                  <Link className={s.cta} href="/noticias">
                    Ver noticias <Icono nombre="flecha" chico />
                  </Link>
                  {hayAnteriores && anioSeleccionado !== null && (
                    <button type="button" className={s.ghost} onClick={() => onChangeAnio(null)}>
                      Ver sorteos anteriores
                    </button>
                  )}
                </div>
              </div>

              <div className={s.mientras}>
                <span className={`${s.kick} ${s.h2k}`}>Mientras tanto</span>
                <h2 className={s.h2}>También te puede interesar</h2>
                <div className={s.mini}>
                  {noticia && (
                    <Link href={`/actividades/noticias/${noticia.id}`}>
                      <Afiche src={noticia.imagen} alt={noticia.titulo} />
                      <div>
                        <p className={s.date}>{fechaCorta(noticia.fecha)}</p>
                        <h3>{noticia.titulo}</h3>
                      </div>
                    </Link>
                  )}
                  <Link href="/actividades/ferias">
                    <Afiche src="/images/portada/trabajadores-corpac.webp" alt="" />
                    <div>
                      <p className={s.date}>Ferias</p>
                      <h3>Revisa las ferias del año</h3>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
