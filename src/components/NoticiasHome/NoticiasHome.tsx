import styles from "./Noticias.module.css";

export default async function NoticiasHome() {
  try {
    // Llamada al endpoint que obtiene noticias desde tu controlador MVC
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/noticias`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Error al cargar noticias");
    const todasLasNoticias = await res.json();

    // Tomar solo las 3 primeras (más recientes)
    const noticias = todasLasNoticias.slice(0, 3);

    return (
      <section className={styles.noticiasSection}>
        <h2 className={styles.noticiasTitulo}>Noticias</h2>

        {noticias.length === 0 ? (
          <p className={styles.noticiasVacio}>No hay noticias por mostrar.</p>
        ) : (
          <div className={styles.noticiasContainer}>
            {noticias.map((noticia: any) => (
              <div key={noticia.id} className={styles.noticiaCard}>
                <img
                  src={noticia.imagen || "/Noticias_site.jpg"}
                  alt={noticia.titulo}
                  className={styles.noticiaImagen}
                />
                <h3 className={styles.noticiaTituloCard}>{noticia.titulo}</h3>
                <p className={styles.noticiaTexto}>{noticia.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error("Error al cargar noticias:", error);
    return (
      <section className={styles.noticiasSection}>
        <h2 className={styles.noticiasTitulo}>Noticias</h2>
        <p className={styles.noticiasVacio}>No hay noticias por mostrar.</p>
      </section>
    );
  }
}
