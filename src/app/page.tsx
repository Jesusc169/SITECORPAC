import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import styles from "@/styles/Home.module.css";
import NoticiasHome from "@/components/NoticiasHome/NoticiasHome";
import Fundamento from "@/components/Fundamento/Fundamento";
import Beneficios from "@/components/Beneficios/Beneficios";
import WhatsAppIcon from "@/components/WhatsAppIcon/WhatsAppIcon";
import Footer from "@/components/Footer/Footer";

import { NoticiasController } from "@/controllers/noticiasController";
import { Noticia } from "@/types/noticia";

export default async function HomePage() {
  // 🔹 SSR: obtenemos noticias desde el controlador
  const noticiasRaw = await NoticiasController.obtenerNoticias();

  // 🔹 Normalizamos los datos: imagen null → placeholder
  const noticias: Noticia[] = noticiasRaw.map(n => ({
    ...n,
    imagen: n.imagen ?? "/placeholder.png", // colocar imagen por defecto si null
  }));

  return (
    <>
      {/* 🔹 Cabecera superior */}
      <Cabecera />

      {/* 🔹 Navbar principal */}
      <Navbar />

      {/* 🔹 Imagen principal con frases */}
      <section className={styles.contenedorImagen}>
        <img
          src="/Fondo_principal.png"
          alt="Fondo principal"
          className={styles.imagenFondo}
          loading="lazy" // lazy loading para mejorar performance
        />

        <div className={styles.textosSobreImagen}>
          <h1 className={styles.frasePrincipal}>SITECORPAC</h1>
          <h2 className={styles.fraseSecundaria}>
            Sindicato Nacional Unificado de Trabajadores de CORPAC
          </h2>
        </div>
      </section>

      {/* 🔹 Noticias (carrusel seguro) */}
      <NoticiasHome noticias={noticias} />

      {/* 🔹 Secciones institucionales */}
      <Fundamento />
      <Beneficios />

      {/* 🔹 WhatsApp flotante */}
      <WhatsAppIcon />

      {/* 🔹 Footer */}
      <Footer />
    </>
  );
}
