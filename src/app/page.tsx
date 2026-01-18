// app/page.tsx
import Cabecera from "../components/Cabecera/Cabecera";
import Navbar from "../components/Navbar/Navbar"; // ajusta la ruta si tu Navbar está en otra carpeta
import styles from "../styles/Home.module.css";
import NoticiasHome from "../components/NoticiasHome/NoticiasHome";
import Fundamento from "../components/Fundamento/Fundamento";
import Beneficios from "../components/Beneficios/Beneficios";
import WhatsAppIcon from "../components/WhatsAppIcon/WhatsAppIcon";
import Footer from "../components/Footer/Footer";


export default function HomePage() {
  return (
    <main>
      <Cabecera />

      {/* 🔹 Navbar debajo del rectángulo */}
      <Navbar />

      {/* 🔹 Contenedor principal debajo del Navbar */}
      <div className={styles.contenedorImagen}>
          <img
            src="/Fondo_principal.png"
            alt="Fondo principal"
            className={styles.imagenFondo}
          />

        {/* Frases superpuestas */}
        <div className={styles.textosSobreImagen}>
          <div className={styles.frasePrincipal}>
            <p>SITECORPAC</p>
          </div>
          <div className={styles.fraseSecundaria}>
            <p>Sindicato Nacional Unificado de Trabajadores de CORPAC</p>
          </div>
        </div>
      </div>

      {/* 🔹 Últimas noticias */}
      <NoticiasHome />
      <Fundamento />
      <Beneficios />
      <WhatsAppIcon />
      <Footer />

    </main>
  );
}
