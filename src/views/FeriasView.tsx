"use client";

import styles from "@/app/actividades/ferias/ferias.module.css";

/* ==========================
   Tipos
========================== */
export interface Empresa {
  id: number;
  nombre: string;
  logo_url: string;
}

export interface EventoFeriaEmpresa {
  empresa: Empresa;
}

export interface EventoFeriaFecha {
  id: string | number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

export interface EventoFeria {
  id: string | number;
  titulo: string;
  descripcion: string;
  anio: number;
  imagen_portada?: string | null;
  evento_feria_empresa: EventoFeriaEmpresa[];
  evento_feria_fecha: EventoFeriaFecha[];
}

export interface FeriasViewProps {
  feriasList: EventoFeria[];
  empresasList?: Empresa[];
  aniosDisponibles?: number[];
  anioSeleccionado?: number | null;
  onChangeAnio?: (anio: number | null) => void;
  loading: boolean;
  transitioning?: boolean;
}

/* ==========================
   Helpers
========================== */
function formatHora(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hora12 = h % 12 || 12;
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ==========================
   Componente
========================== */
export default function FeriasView({
  feriasList,
  empresasList,
  aniosDisponibles,
  anioSeleccionado,
  onChangeAnio,
  loading,
  transitioning = false,
}: FeriasViewProps) {
  const empresas = empresasList || Array.isArray(feriasList)
    ? Array.from(
        new Map(
          feriasList.flatMap(f => f.evento_feria_empresa || []).map(e => [e.empresa.id, e.empresa])
        ).values()
      )
    : [];

  return (
    <main className={styles.main}>
      <h1>Ferias</h1>

      <p className={styles.intro}>
        El SITECORPAC promueve espacios de integración comercial donde empresas y
        emprendedores ofrecen productos a precios preferenciales dentro de las
        instalaciones de CORPAC.
      </p>

      {empresas.length > 0 && (
        <>
          <h2 className={styles.subtitulo}>Empresas afiliadas</h2>
          <div className={styles.empresas}>
            <div className={styles.empresasTrack}>
              {[...empresas, ...empresas].map((empresa, index) => (
                <div className={styles.logoItem} key={index}>
                  <img src={empresa.logo_url} alt={empresa.nombre} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {aniosDisponibles && onChangeAnio && (
        <div className={styles.filtros}>
          {aniosDisponibles.map(anio => (
            <button
              key={anio}
              onClick={() => onChangeAnio(anio)}
              className={`${styles.filtroBtn} ${anioSeleccionado === anio ? styles.activo : ""}`}
            >
              Año {anio}
            </button>
          ))}
          {anioSeleccionado !== null && (
            <button className={styles.filtroReset} onClick={() => onChangeAnio(null)}>
              Ver todas
            </button>
          )}
        </div>
      )}

      {(loading || transitioning) && <p className={styles.loading}>Cargando ferias…</p>}

      {!loading &&
        !transitioning &&
        feriasList.map(feria => (
          <section key={feria.id} className={styles.feria}>
            <div className={styles.feriaImagen}>
              <img src={feria.imagen_portada || "/images/ferias/default.jpg"} alt={feria.titulo} />
            </div>
            <div className={styles.feriaContenido}>
              <h3>{feria.titulo}</h3>
              <p className={styles.descripcion}>{feria.descripcion}</p>

              <div className={styles.feriaDatos}>
                {feria.evento_feria_fecha.map(fecha => (
                  <div key={fecha.id} className={styles.feriaBloqueFecha}>
                    <div className={styles.feriaDato}>
                      📅 <strong>Fecha:</strong> {formatFecha(fecha.fecha)}
                    </div>
                    <div className={styles.feriaDato}>
                      🕘 <strong>Hora:</strong> {formatHora(fecha.hora_inicio)} – {formatHora(fecha.hora_fin)}
                    </div>
                    <div className={styles.feriaDato}>
                      📍 <strong>Lugar:</strong> {fecha.ubicacion}
                      {fecha.zona && ` – ${fecha.zona}`}
                    </div>
                  </div>
                ))}

                <div className={styles.feriaDato}>
                  🏢 <strong>Empresas:</strong> {feria.evento_feria_empresa.map(e => e.empresa.nombre).join(", ")}
                </div>
              </div>
            </div>
          </section>
        ))}
    </main>
  );
}
