import Link from "next/link";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import NoticiasHome, { type NoticiaResumen } from "@/components/NoticiasHome/NoticiasHome";
import Fundamento from "@/components/Fundamento/Fundamento";
import Beneficios from "@/components/Beneficios/Beneficios";
import Icono, { type NombreIcono } from "@/components/Icono/Icono";
import { ENLACES } from "@/lib/datosInstitucionales";
import s from "@/styles/Sitio.module.css";

import { NoticiasController } from "@/controllers/noticiasController";

// NoticiasController cachea 60s y se invalida al instante al
// publicar/editar/eliminar (revalidateTag("noticias")).

// Accesos rápidos a los trámites (tablero de la propuesta C).
const ACCESOS: {
  icono: NombreIcono;
  titulo: string;
  texto: string;
  accion: string;
  href: string;
  externo?: boolean;
}[] = [
  { icono: "dinero", titulo: "Préstamos", texto: "Cooperativas en convenio", accion: "Solicitar", href: "/tramites/prestamos" },
  { icono: "corazon", titulo: "Fallecimiento", texto: "Beneficio para la familia", accion: "Ver requisitos", href: "/tramites/beneficio-fallecido" },
  { icono: "calendario", titulo: "Ferias", texto: "Precios accesibles", accion: "Ver fechas", href: "/actividades/ferias" },
  { icono: "regalo", titulo: "Sorteos", texto: "Fiestas Patrias y Navidad", accion: "Ver", href: "/actividades/sorteos" },
  { icono: "balanza", titulo: "Asesoría legal", texto: "Reclamos y despidos", accion: "Consultar", href: ENLACES.whatsappAsesoria, externo: true },
];

export default async function HomePage() {
  const noticiasRaw = await NoticiasController.obtenerNoticias();

  const noticias: NoticiaResumen[] = noticiasRaw.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion,
    imagen: n.imagen,
    // n.fecha puede llegar como Date (cache miss, recién leído de Prisma) o
    // como string (cache hit: unstable_cache lo serializó a JSON).
    fecha: typeof n.fecha === "string" ? n.fecha : n.fecha.toISOString(),
  }));

  return (
    <PaginaPublica>
      <section className={s.hero}>
        <div className={`${s.ancho} ${s.heroGrid}`}>
          <div>
            <span className={s.kick}>SITECORPAC · Trabajadores de CORPAC</span>
            <h1>Defendemos condiciones de trabajo digno para todos los trabajadores de CORPAC.</h1>
            <p>Organización sindical representativa, democrática y comprometida con sus afiliados.</p>
            <div className={s.btns}>
              <a className={s.cta} href={ENLACES.whatsappUnete} target="_blank" rel="noopener noreferrer">
                <Icono nombre="chat" chico />
                Únete al SITE
                <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
              </a>
              <Link className={s.ghost} href="/nuestra_historia">
                Conócenos
              </Link>
            </div>
          </div>
          <div className={s.heroArte}>
            <img
              src="/images/portada/trabajadores-corpac.webp"
              alt="Ilustración de trabajadores de CORPAC abrazados frente a un aeropuerto"
              width={924}
              height={735}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <nav className={`${s.ancho} ${s.quick}`} aria-label="Trámites y actividades">
        <ul>
          {ACCESOS.map((a) => (
            <li key={a.titulo}>
              {a.externo ? (
                <a href={a.href} target="_blank" rel="noopener noreferrer">
                  <Acceso {...a} />
                  <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
                </a>
              ) : (
                <Link href={a.href}>
                  <Acceso {...a} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <NoticiasHome noticias={noticias} />
      <Beneficios />
      <Fundamento />
    </PaginaPublica>
  );
}

function Acceso({ icono, titulo, texto, accion }: Readonly<(typeof ACCESOS)[number]>) {
  return (
    <>
      <span className={s.ico}>
        <Icono nombre={icono} />
      </span>
      <b>{titulo}</b>
      <span className={s.desc}>{texto}</span>
      <span className={s.go}>
        {accion} <Icono nombre="flecha" chico />
      </span>
    </>
  );
}
