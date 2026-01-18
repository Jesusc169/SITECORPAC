// src/components/Cabecera.tsx
import styles from "./Cabecera.module.css";

export default function Cabecera() {
  return (
    <div className={styles.rectangulo}>
      <img
        src="/logo_site.jpg"
        alt="Logo SITE CORPAC"
        className={styles.logo}
      />
      <h1 className={styles.titulo}>SITECORPAC</h1>

      {/* Contenedor de frases */}
      <div className={styles.frases}>
        <div className={styles.frase}>
          <p>
            Fomentar la equidad social y garantizar condiciones de trabajo digno
            en CORPAC
          </p>
        </div>
        <div className={styles.frase}>
          <p>
            El SITECORPAC es una organización sindical de los trabajadores de
            CORPAC
          </p>
        </div>
      </div>
    </div>
  );
}
