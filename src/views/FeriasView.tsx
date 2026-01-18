import styles from "@/app/actividades/Ferias/ferias.module.css";

/* ======================================================
   Tipos
   ====================================================== */
interface Empresa {
  id: number;
  nombre: string;
  logo_url: string;
}

interface EventoFeriaEmpresa {
  empresa: Empresa;
}

interface EventoFeriaFecha {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

interface EventoFeria {
  id: number;
  titulo: string;
  descripcion: string;
  anio: number;
  imagen_portada?: string | null;
  evento_feria_empresa: EventoFeriaEmpresa[];
  evento_feria_fecha: EventoFeriaFecha[];
}

interface FeriasViewProps {
  data: EventoFeria[];
  aniosDisponibles: number[];
  anioSeleccionado: number | null;
  onChangeAnio: (anio: number | null) => void;
  loading: boolean;
}

/* ======================================================
   Helpers
   ====================================================== */
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

/* ======================================================
   Componente
   ====================================================== */
export default function FeriasView({
  data,
  aniosDisponibles,
  anioSeleccionado,
  onChangeAnio,
  loading,
}: FeriasViewProps) {
  /* 🔹 Empresas únicas para el carrusel */
  const empresas = Array.isArray(data)
    ? Array.from(
        new Map(
          data
            .flatMap(f => f.evento_feria_empresa || [])
            .map(e => [e.empresa.id, e.empresa])
        ).values()
      )
    : [];

  return (
    <main className={styles.main}>
      {/* ======================================================
          TÍTULO
          ====================================================== */}
      <h1>Ferias</h1>

      {/* ======================================================
          INTRODUCCIÓN
          ====================================================== */}
      <p className={styles.intro}>
        El SITECORPAC promueve espacios de integración comercial donde empresas y
        emprendedores ofrecen productos a precios preferenciales dentro de las
        instalaciones de CORPAC, generando beneficios directos para nuestros
        afiliados.
      </p>

      {/* ======================================================
          IMAGEN GENERAL
          ====================================================== */}
      <img
        src="/images/ferias/feria-colinda.jpeg"
        alt="Ferias institucionales"
        className={styles.portadaGeneral}
      />

      {/* ======================================================
          EMPRESAS AFILIADAS
          ====================================================== */}
      {empresas.length > 0 && (
        <>
          <h2 className={styles.subtitulo}>Empresas afiliadas</h2>

          <div className={styles.empresas}>
            <div className={styles.empresasTrack}>
              {[...empresas, ...empresas].map((empresa, index) => (
                <div className={styles.logoItem} key={index}>
                  <img
                    src={empresa.logo_url}
                    alt={empresa.nombre}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          FILTROS POR AÑO
          ====================================================== */}
      <div className={styles.filtros}>
        {aniosDisponibles.map(anio => (
          <button
            key={anio}
            onClick={() => onChangeAnio(anio)}
            className={`${styles.filtroBtn} ${
              anioSeleccionado === anio ? styles.activo : ""
            }`}
          >
            Año {anio}
          </button>
        ))}

        {anioSeleccionado !== null && (
          <button
            className={styles.filtroReset}
            onClick={() => onChangeAnio(null)}
          >
            Ver todas
          </button>
        )}
      </div>

      {/* ======================================================
          ESTADOS
          ====================================================== */}
      {loading && <p className={styles.loading}>Cargando ferias…</p>}

      {!loading && data.length === 0 && (
        <p className={styles.empty}>No hay ferias para este año.</p>
      )}

      {/* ======================================================
          TARJETAS DE FERIAS
          ====================================================== */}
      {!loading &&
        data.map(feria => (
          <section key={feria.id} className={styles.feria}>
            {/* Imagen */}
            <div className={styles.feriaImagen}>
              <img
                src={feria.imagen_portada || "/images/ferias/default.jpg"}
                alt={feria.titulo}
              />
            </div>

            {/* Contenido */}
            <div className={styles.feriaContenido}>
              {/* Nombre */}
              <h3>{feria.titulo}</h3>

              {/* Descripción */}
              <p className={styles.descripcion}>{feria.descripcion}</p>

              {/* Fechas (pueden ser varias) */}
              <div className={styles.feriaDatos}>
                {feria.evento_feria_fecha.map(fecha => (
                  <div key={fecha.id} className={styles.feriaBloqueFecha}>
                    <div className={styles.feriaDato}>
                      📅 <strong>Fecha:</strong>{" "}
                      {formatFecha(fecha.fecha)}
                    </div>

                    <div className={styles.feriaDato}>
                      🕘 <strong>Hora:</strong>{" "}
                      {formatHora(fecha.hora_inicio)} –{" "}
                      {formatHora(fecha.hora_fin)}
                    </div>

                    <div className={styles.feriaDato}>
                      📍 <strong>Lugar:</strong>{" "}
                      {fecha.ubicacion}
                      {fecha.zona && ` – ${fecha.zona}`}
                    </div>
                  </div>
                ))}

                {/* Empresas */}
                <div className={styles.feriaDato}>
                  🏢 <strong>Empresas:</strong>{" "}
                  {feria.evento_feria_empresa
                    .map(e => e.empresa.nombre)
                    .join(", ")}
                </div>
              </div>
            </div>
          </section>
        ))}
    </main>
  );
}
