"use client";

import styles from "@/app/actividades/ferias/ferias.module.css";

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

export interface EventoFeria {
  id: number;
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
  loading: boolean;
  transitioning?: boolean;
  aniosDisponibles?: number[];
  anioSeleccionado?: number | null;
  onChangeAnio?: (anio: number | null) => void;
}

// =========================
// Helpers
// =========================
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

// =========================
// Componente
// =========================
export default function FeriasView({
  feriasList,
  empresasList = [],
  loading,
  transitioning = false,
  aniosDisponibles,
  anioSeleccionado,
  onChangeAnio,
}: FeriasViewProps) {
  return (
    <main className={styles.main}>
      <h1>Ferias</h1>

      {/* =========================
          TEXTO PROMOCIONAL
      ========================== */}
      <section className={styles.promocion}>
        <p>
          El SITECORPAC organiza de manera mensual ferias de venta de comidas con el objetivo de promover la compra y consumo de alimentos saludables. Estas actividades buscan facilitar a los colaboradores el acceso a productos de calidad a precios accesibles, al mismo tiempo que se impulsa y fortalece el desarrollo de emprendimientos y negocios locales.
        </p>
      </section>

      {/* =========================
          CARRUSEL DE EMPRESAS
      ========================== */}
      {empresasList.length > 0 && (
        <section className={styles.empresas}>
          <div className={styles.empresasTrack}>
            {[...empresasList, ...empresasList].map(
              (empresa, index) => (
                <div
                  key={`${empresa.id}-${index}`}
                  className={styles.logoItem}
                >
                  <img
                    src={
                      empresa.logo_url ||
                      "/images/empresas/default.png"
                    }
                    alt={empresa.nombre}
                    title={empresa.nombre}
                    loading="lazy"
                  />
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* =========================
          FILTRO POR AÑO
      ========================== */}
      {aniosDisponibles &&
        onChangeAnio &&
        aniosDisponibles.length > 0 && (
          <div className={styles.filtros}>
            {aniosDisponibles.map((anio) => (
              <button
                key={anio}
                onClick={() => onChangeAnio(anio)}
                className={
                  anioSeleccionado === anio
                    ? styles.activo
                    : ""
                }
              >
                Año {anio}
              </button>
            ))}

            {anioSeleccionado !== null && (
              <button onClick={() => onChangeAnio(null)}>
                Ver todas
              </button>
            )}
          </div>
        )}

      {/* =========================
          ESTADOS
      ========================== */}
      {(loading || transitioning) && (
        <p className={styles.estado}>Cargando ferias…</p>
      )}

      {!loading &&
        !transitioning &&
        feriasList.length === 0 && (
          <p className={styles.estado}>
            No hay ferias disponibles.
          </p>
        )}

      {/* =========================
          LISTADO DE FERIAS
      ========================== */}
      {!loading &&
        !transitioning &&
        feriasList.map((feria) => (
          <section key={feria.id} className={styles.feria}>
            <img
              src={
                feria.imagen_portada ||
                "/images/ferias/default.jpg"
              }
              alt={feria.titulo}
              loading="lazy"
            />

            <div className={styles.feriaBody}>
              <h3>{feria.titulo}</h3>

              <p className={styles.descripcion}>
                {feria.descripcion}
              </p>

              {feria.evento_feria_fecha.map((fecha) => (
                <div
                  key={fecha.id}
                  className={styles.datos}
                >
                  <p>📅 {formatFecha(fecha.fecha)}</p>
                  <p>
                    🕘 {formatHora(fecha.hora_inicio)} –{" "}
                    {formatHora(fecha.hora_fin)}
                  </p>
                  <p>
                    📍 {fecha.ubicacion}
                    {fecha.zona
                      ? ` - ${fecha.zona}`
                      : ""}
                  </p>
                </div>
              ))}

              <p className={styles.empresasTexto}>
                🏢 Empresas participantes:{" "}
                {feria.evento_feria_empresa
                  .map((e) => e.empresa.nombre)
                  .join(", ")}
              </p>
            </div>
          </section>
        ))}
    </main>
  );
}
