import styles from "./Fundamento.module.css";

export default function Fundamento() {
  const fundamentos = [
    {
      titulo: "Base legal",
      descripcion: "Nuestra organización se sustenta en el marco jurídico vigente",
      items: ["Constitución Política", "Ley N.º 728", "Registro oficial"],
    },
    {
      titulo: "Principios institucionales",
      descripcion: "Valores que guían nuestras acciones y decisiones",
      items: ["Democracia", "Solidaridad", "Transparencia"],
    },
    {
      titulo: "Estructura organizacional",
      descripcion: "Organización clara y orientada al servicio sindical",
      items: ["Estatuto aprobado", "Estructura definida", "Funciones sindicales"],
    },
  ];

  return (
    <section className={styles.fundamentoSection}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Fundamento sindical</h2>
        <p className={styles.subtitulo}>
          Nuestra labor se apoya en principios legales, organizativos y éticos
        </p>
      </div>

      <div className={styles.cardsContainer}>
        {fundamentos.map((fundamento, index) => (
          <div key={index} className={styles.card}>
            <h3 className={styles.cardTitulo}>{fundamento.titulo}</h3>
            <p className={styles.cardDescripcion}>
              {fundamento.descripcion}
            </p>

            <ul className={styles.lista}>
              {fundamento.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
