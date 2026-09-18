import Image from "next/image";
import Cabecera from "@/components/Cabecera/Cabecera";
import Navbar from "@/components/Navbar/Navbar";
import styles from "@/styles/Home.module.css";
import NoticiasHome from "@/components/NoticiasHome/NoticiasHome";
import Fundamento from "@/components/Fundamento/Fundamento";
import Beneficios from "@/components/Beneficios/Beneficios";
import WhatsAppIcon from "@/components/WhatsAppIcon/WhatsAppIcon";
import Footer from "@/components/Footer/Footer";

import { NoticiasController } from "@/controllers/noticiasController";

// Antes forzaba "force-dynamic" para no dejar noticias viejas en caché.
// Ahora NoticiasController cachea 60s y se invalida al instante al
// publicar/editar/eliminar (revalidateTag("noticias")), así que ya no hace
// falta forzar esta página completa a renderizarse sin caché en cada visita.

/* ✅ Tipo LOCAL */
interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha: string;
}

export default async function HomePage() {
  // 🔹 Ahora se ejecutará en cada request en producción
  const noticiasRaw = await NoticiasController.obtenerNoticias();

  const noticias: Noticia[] = noticiasRaw.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion,
    imagen: n.imagen ?? "/placeholder.png",
    // n.fecha puede llegar como Date (cache miss, recién leído de Prisma) o
    // como string (cache hit: unstable_cache lo serializó a JSON), así que no
    // se puede asumir que siempre trae .toISOString().
    fecha: typeof n.fecha === "string" ? n.fecha : n.fecha.toISOString(),
  }));

  return (
    <>
      <Cabecera />
      <Navbar />

      <section className={styles.contenedorImagen}>
        <Image
          src="/Fondo_principal.png"
          alt="Fondo principal"
          fill
          priority
          sizes="100vw"
          className={styles.imagenFondo}
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