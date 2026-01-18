// src/views/NuestraHistoriaView.tsx
import styles from "../app/nuestra_historia/NuestraHistoria.module.css";
import { NuestraHistoriaData } from "../models/NuestraHistoriaModel";

interface Props {
  data: NuestraHistoriaData;
}

export default function NuestraHistoriaView({ data }: Props) {
  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>{data.titulo}</h2>
      <p className={styles.introduccion}>{data.introduccion}</p>

      <div className={styles.timeline}>
        {data.eventos.map((evento, index) => (
          <div key={index} className={styles.evento}>
            <span className={styles.año}>{evento.año}</span>
            <p>{evento.descripcion}</p>
          </div>
        ))}
      </div>

      <div className={styles.footerNote}>
        <small>
          Los datos históricos de CORPAC están basados en registros públicos. La narrativa del sindicato puede estar sujeta a revisión institucional.
        </small>
      </div>
    </section>
  );
}
