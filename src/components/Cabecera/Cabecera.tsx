// src/components/Cabecera.tsx
import styles from "./Cabecera.module.css";

export default function Cabecera() {
  return (
    <header className={styles.cabecera}>
      <div className={styles.contenedor}>
        {/* Logo + nombre */}
        <div className={styles.marca}>
          <img
            src="/logo_site.jpg"
            alt="Logo SITECORPAC"
            className={styles.logo}
          />
          <div>
            <h1 className={styles.titulo}>SITECORPAC</h1>
            <span className={styles.subtitulo}>
              Sindicato de Trabajadores de CORPAC
            </span>
          </div>
        </div>

        {/* Mensaje institucional */}
        <div className={styles.mensaje}>
          <p>
            Fomentamos la equidad social y defendemos condiciones de trabajo
            dignas para todos los trabajadores de CORPAC.
          </p>
          <p className={styles.mensajeSecundario}>
            Organización sindical representativa, democrática y comprometida
            con sus afiliados.
          </p>
        </div>
      </div>
    </header>
  );
}
