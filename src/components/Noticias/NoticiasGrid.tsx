import Link from "next/link";
import styles from "./NoticiasGrid.module.css";

interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fechaPublicacion: string | null;
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "";

  const date = new Date(fecha);

  if (isNaN(date.getTime())) {
    console.warn("Fecha inválida:", fecha);
    return "";
  }

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function NoticiasGrid({ noticias }: { noticias: Noticia[] }) {
  return (
    <div className={styles.grid}>
      {noticias.map((n) => (
        <article key={n.id} className={styles.card}>
          <img src={n.imagen} alt={n.titulo} />

          <div className={styles.body}>
            {n.fechaPublicacion && (
              <span className={styles.fecha}>
                {formatearFecha(n.fechaPublicacion)}
              </span>
            )}

            <h3>{n.titulo}</h3>
            <p>{n.descripcion}</p>

            <Link
              href={`/actividades/noticias/${n.id}`}
              className={styles.boton}
            >
              Ver más
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
