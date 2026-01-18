import styles from "./Fundamento.module.css";

export default function Fundamento() {
  const fundamentos = [
    {
      titulo: "Nos basamos en  documentos legales",
      items: ["Constitución", "Ley 728", "Registro oficial"],
    },
    {
      titulo: "Nuestros principios",
      items: ["Democracia", "Solidaridad", "Transparencia"],
    },
    {
      titulo: "Nuestra organización",
      items: ["Estatuto aprobado", "Estructura clara", "Funciones sindicales"],
    },
  ];

  return (
    <section className={styles.fundamentoSection}>
      <h2 className={styles.titulo}>Fundamento sindical</h2>
      <div className={styles.cardsContainer}>
        {fundamentos.map((fundamento, index) => (
          <div key={index} className={styles.card}>
            <h3 className={styles.cardTitulo}>{fundamento.titulo}</h3>
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
