"use client";

import styles from "@/app/actividades/ferias/ferias.module.css"; 

// =========================
// Tipos
// =========================
export interface Empresa {
  id: number;
  nombre: string;
  logo_url: string;
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
  empresasList,
  loading,
  transitioning = false,
  aniosDisponibles,
  anioSeleccionado,
  onChangeAnio,
}: FeriasViewProps) {
  const empresas = empresasList || [];

  return (
    <main className={styles.main}>
      <h1>Ferias</h1>

      {aniosDisponibles && onChangeAnio && (
        <div className={styles.filtros}>
          {aniosDisponibles.map((anio) => (
            <button
              key={anio}
              onClick={() => onChangeAnio(anio)}
              className={anioSeleccionado === anio ? styles.activo : ""}
            >
              Año {anio}
            </button>
          ))}
          {anioSeleccionado !== null && (
            <button onClick={() => onChangeAnio(null)}>Ver todas</button>
          )}
        </div>
      )}

      {(loading || transitioning) && <p>Cargando ferias…</p>}

      {!loading && !transitioning && feriasList.length === 0 && (
        <p>No hay ferias disponibles.</p>
      )}

      {!loading &&
        !transitioning &&
        feriasList.map((feria) => (
          <section key={feria.id} className={styles.feria}>
            <img
              src={feria.imagen_portada || "/images/ferias/default.jpg"}
              alt={feria.titulo}
            />
            <h3>{feria.titulo}</h3>
            <p>{feria.descripcion}</p>

            {feria.evento_feria_fecha.map((fecha) => (
              <div key={fecha.id}>
                <p>📅 {formatFecha(fecha.fecha)}</p>
                <p>🕘 {formatHora(fecha.hora_inicio)} - {formatHora(fecha.hora_fin)}</p>
                <p>📍 {fecha.ubicacion}{fecha.zona ? ` - ${fecha.zona}` : ""}</p>
              </div>
            ))}

            <p>
              🏢 Empresas:{" "}
              {feria.evento_feria_empresa.map((e) => e.empresa.nombre).join(", ")}
            </p>
          </section>
        ))}
    </main>
  );
}
