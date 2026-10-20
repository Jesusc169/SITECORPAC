"use client";

import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Afiche from "@/components/Sitio/Afiche";
import Icono from "@/components/Icono/Icono";
import GaleriaBoton from "@/components/GaleriaFotos/GaleriaBoton";
import { diaConSemana, feriaFinalizada, rangoDias } from "@/lib/fechas";
import { rutaPublica } from "@/lib/rutas";
import s from "@/styles/Sitio.module.css";

// =========================
// Tipos
// =========================
export interface Empresa {
  id: number;
  nombre: string;
  logo_url: string | null;
}

export interface EventoFeriaEmpresa {
  empresa: Empresa;
}

export interface EventoFeriaFecha {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

export interface EventoFeriaImagen {
  id: number;
  url: string;
  principal: boolean;
}

export interface EventoFeria {
  id: number;
  titulo: string;
  descripcion: string;
  anio: number;
  imagen_portada?: string | null;
  evento_feria_empresa: EventoFeriaEmpresa[];
  evento_feria_fecha: EventoFeriaFecha[];
  evento_feria_imagen?: EventoFeriaImagen[];
}

export interface FeriasViewProps {
  feriasList: EventoFeria[];
  loading: boolean;
  aniosDisponibles?: number[];
  anioSeleccionado?: number | null;
  onChangeAnio?: (anio: number | null) => void;
}

// =========================
// Helpers
// =========================
function formatHora(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const hora12 = h % 12 || 12;
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Ordenar por fecha real, de la más reciente a la más antigua.
function ordenarFerias(ferias: EventoFeria[]) {
  return [...ferias].sort((a, b) => {
    const fechaA = a.evento_feria_fecha?.[0]?.fecha;
    const fechaB = b.evento_feria_fecha?.[0]?.fecha;

    if (!fechaA) return 1;
    if (!fechaB) return -1;

    return new Date(fechaB).getTime() - new Date(fechaA).getTime();
  });
}

function TarjetaFeria({ feria }: Readonly<{ feria: EventoFeria }>) {
  const dias = feria.evento_feria_fecha.map((f) => f.fecha);
  const finalizada = feriaFinalizada(dias);
  const fotos = (feria.evento_feria_imagen ?? []).map((i) => i.url);

  return (
    <article className={s.feria}>
      <div>
        <Afiche src={feria.imagen_portada} alt={feria.titulo} />
        <div className={s.galeria}>
          <GaleriaBoton imagenes={fotos} titulo={feria.titulo} className={s.chip} />
        </div>
      </div>

      <div>
        {dias.length > 0 && (
          <span className={`${s.badge} ${finalizada ? s.badgePast : ""}`}>
            <Icono nombre="calendario" chico />
            {rangoDias(dias)}
            {finalizada ? " · Finalizada" : ""}
          </span>
        )}
        <h3>{feria.titulo}</h3>
        {feria.descripcion && <p className={s.texto}>{feria.descripcion}</p>}

        {feria.evento_feria_fecha.length > 0 && (
          <ul className={s.sched}>
            {feria.evento_feria_fecha.map((f) => (
              <li key={f.id}>
                <span>
                  <Icono nombre="calendario" chico />
                  {diaConSemana(f.fecha)}
                </span>
                <span>
                  <Icono nombre="reloj" chico />
                  {formatHora(f.hora_inicio)} – {formatHora(f.hora_fin)}
                </span>
                <span>
                  <Icono nombre="ubicacion" chico />
                  {f.ubicacion}
                  {f.zona ? ` · ${f.zona}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {feria.evento_feria_empresa.length > 0 && (
          <>
            <p className={s.lbl}>Empresas participantes</p>
            <div className={s.logos}>
              {feria.evento_feria_empresa.map(({ empresa }) => (
                <span key={empresa.id} title={empresa.nombre}>
                  <img
                    src={empresa.logo_url ? rutaPublica(empresa.logo_url) : "/images/empresas/default.png"}
                    alt={empresa.nombre}
                    loading="lazy"
                  />
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// =========================
// Componente
// =========================
export default function FeriasView({
  feriasList,
  loading,
  aniosDisponibles = [],
  anioSeleccionado = null,
  onChangeAnio,
}: Readonly<FeriasViewProps>) {
  const ferias = ordenarFerias(feriasList);

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Actividades" }, { texto: "Ferias" }]}
        rotulo="Actividades"
        titulo="Ferias"
        entrada="Productos de calidad a precios accesibles para los afiliados, en tu sede."
      >
        {onChangeAnio && aniosDisponibles.length > 0 && (
          <fieldset className={s.chips} aria-label="Filtrar ferias por año">
            {aniosDisponibles.map((anio) => (
              <button
                key={anio}
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
              Ver todas
            </button>
          </fieldset>
        )}
      </EncabezadoPagina>

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          <h2 className="sr-only">{anioSeleccionado ? `Ferias de ${anioSeleccionado}` : "Todas las ferias"}</h2>
          {loading && <p className={s.estado}>Cargando ferias…</p>}
          {!loading && ferias.length === 0 && <p className={s.estado}>No hay ferias disponibles.</p>}
          {!loading && ferias.map((feria) => <TarjetaFeria key={feria.id} feria={feria} />)}
        </div>
      </section>
    </>
  );
}
