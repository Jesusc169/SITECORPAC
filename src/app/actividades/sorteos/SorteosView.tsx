import styles from "./sorteos.module.css";

interface SorteoProducto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  cantidad?: number | null;
}

interface Sorteo {
  id: number;
  nombre: string;
  descripcion: string;
  imagen?: string | null;
  lugar: string;
  fecha_hora: string;
  anio: number;
  sorteo_producto: SorteoProducto[];
}

interface Props {
  sorteos: Sorteo[];
  onChangeAnio: (anio: number | null) => void;
}

export default function SorteosView({ sorteos, onChangeAnio }: Props) {
  const aniosDisponibles = [2026, 2025, 2024];

  return (
    <section className={styles.container}>
      {/* ===========================
          CABECERA
      ============================ */}
      <header className={styles.header}>
        <h1>Sorteos del SITECORPAC</h1>
        <p>
          El SITECORPAC organiza sorteos especiales durante el año en fechas
          conmemorativas como Fiestas Patrias y Navidad.
        </p>
      </header>

      {/* ===========================
          FILTRO POR AÑO
      ============================ */}
      <div className={styles.anios}>
        {aniosDisponibles.map((anio) => (
          <button
            key={anio}
            type="button"
            onClick={() => onChangeAnio(anio)}
          >
            {anio}
          </button>
        ))}

        <button type="button" onClick={() => onChangeAnio(null)}>
          Ver todos
        </button>
      </div>

      {/* ===========================
          LISTADO DE SORTEOS
      ============================ */}
      {sorteos.length === 0 && (
        <p className={styles.empty}>
          No hay sorteos disponibles para este año.
        </p>
      )}

      <div className={styles.list}>
        {sorteos.map((sorteo) => (
          <article key={sorteo.id} className={styles.card}>
            {/* Imagen */}
            {sorteo.imagen ? (
              <img
                src={sorteo.imagen}
                alt={sorteo.nombre}
                loading="lazy"
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                Imagen no disponible
              </div>
            )}

            {/* Contenido */}
            <div className={styles.content}>
              <h3>{sorteo.nombre}</h3>

              <p className={styles.descripcion}>
                {sorteo.descripcion}
              </p>

              {/* Metadata */}
              <div className={styles.meta}>
                <span>📍 {sorteo.lugar}</span>
                <span>
                  📅{" "}
                  {new Date(sorteo.fecha_hora).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Productos */}
              <ul className={styles.productos}>
                {sorteo.sorteo_producto.length === 0 && (
                  <li>No hay productos registrados</li>
                )}

                {sorteo.sorteo_producto.map((producto) => (
                  <li key={producto.id}>
                    🎁 {producto.nombre}
                    {producto.cantidad && ` (${producto.cantidad})`}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
