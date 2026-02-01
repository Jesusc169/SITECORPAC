import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import styles from "@/styles/Home.module.css";
import NoticiasHome from "@/components/NoticiasHome/NoticiasHome";
import Fundamento from "@/components/Fundamento/Fundamento";
import Beneficios from "@/components/Beneficios/Beneficios";
import WhatsAppIcon from "@/components/WhatsAppIcon/WhatsAppIcon";
import Footer from "@/components/Footer/Footer";

import { NoticiasController } from "@/controllers/noticiasController";

/* ✅ Tipo LOCAL (sin archivo extra, sin lógica de negocio) */
interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha: string;
}

export default async function HomePage() {
  // 🔹 SSR: obtenemos noticias desde el controlador
  const noticiasRaw = await NoticiasController.obtenerNoticias();

  // 🔹 Adaptador (NO cambia lógica del negocio)
  const noticias: Noticia[] = noticiasRaw.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion,
    imagen: n.imagen ?? "/placeholder.png",
    fecha: n.fecha.toISOString(),
  }));

  return (
    <>
      <Cabecera />
      <Navbar />

      <section className={styles.contenedorImagen}>
        <img
          src="/Fondo_principal.png"
          alt="Fondo principal"
          className={styles.imagenFondo}
          loading="lazy"
        />

        <div className={styles.textosSobreImagen}>
          <h1 className={styles.frasePrincipal}>SITECORPAC</h1>
          <h2 className={styles.fraseSecundaria}>
            Sindicato Nacional Unificado de Trabajadores de CORPAC
          </h2>
        </div>
      </section>

      <NoticiasHome noticias={noticias} />

      <Fundamento />
      <Beneficios />
      <WhatsAppIcon />
      <Footer />
    </>
  );
}
