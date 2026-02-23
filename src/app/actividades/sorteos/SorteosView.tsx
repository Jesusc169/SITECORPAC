import styles from "@/app/actividades/sorteos/sorteos.module.css";

interface SorteoProducto {
  id?: number;
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

  // 🔥 soporta ambas formas (backend viejo o nuevo)
  sorteo_producto?: SorteoProducto[];
  premios?: SorteoProducto[];
}

interface Props {
  sorteos: Sorteo[];
  onChangeAnio: (anio: number | null) => void;
}

export default function SorteosView({ sorteos, onChangeAnio }: Props) {
  const aniosDisponibles = [2026, 2025, 2024];

  return (
    <section className={styles.container}>
      {/* CABECERA */}
      <header className={styles.header}>
        <h1>Sorteos del SITECORPAC</h1>
        <p>
          El SITECORPAC organiza sorteos especiales durante el año en fechas
          conmemorativas como Fiestas Patrias y Navidad.
        </p>
      </header>

      {/* FILTRO */}
      <div className={styles.anios}>
        {aniosDisponibles.map((anio) => (
          <button key={`anio-${anio}`} onClick={() => onChangeAnio(anio)}>
            {anio}
          </button>
        ))}
        <button key="ver-todos" onClick={() => onChangeAnio(null)}>
          Ver todos
        </button>
      </div>

      {/* VACÍO */}
      {sorteos.length === 0 && (
        <p className={styles.empty}>
          No hay sorteos disponibles para este año.
        </p>
      )}

      {/* LISTA */}
      <div className={styles.list}>
        {sorteos.map((sorteo) => {
          // 🔥 NORMALIZAR PREMIOS
          const productos =
            sorteo.sorteo_producto ??
            sorteo.premios ??
            [];

          // 🔥 FECHA SEGURA
          const fecha = new Date(sorteo.fecha_hora);
          const fechaValida = !isNaN(fecha.getTime());

          // 🔥 LUGAR SEGURO
          const lugarMostrado =
            sorteo.lugar && sorteo.lugar.trim() !== ""
              ? sorteo.lugar
              : "Lugar no especificado";

          // 🔥 IMAGEN SEGURA (FIX DEFINITIVO)
          const imagenSrc =
            sorteo.imagen && sorteo.imagen.trim() !== ""
              ? sorteo.imagen.startsWith("http") ||
                sorteo.imagen.startsWith("/")
                ? sorteo.imagen
                : `/${sorteo.imagen}`
              : null;

          return (
            <article key={`sorteo-${sorteo.id}`} className={styles.card}>
              {/* Imagen */}
              {imagenSrc ? (
                <img
                  src={imagenSrc}
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
                  {sorteo.descripcion || "Sin descripción disponible."}
                </p>

                {/* META */}
                <div className={styles.meta}>
                  <span>📍 {lugarMostrado}</span>

                  <span>
                    📅{" "}
                    {fechaValida
                      ? fecha.toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Fecha no disponible"}
                  </span>
                </div>

                {/* PREMIOS */}
                <ul className={styles.productos}>
                  {productos.length === 0 && (
                    <li key={`empty-${sorteo.id}`}>
                      No hay productos registrados
                    </li>
                  )}

                  {productos.map((producto, index) => (
                    <li
                      key={
                        producto.id
                          ? `prod-${producto.id}`
                          : `prod-${sorteo.id}-${index}`
                      }
                    >
                      🎁 {producto.nombre}
                      {producto.cantidad
                        ? ` (${producto.cantidad})`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}