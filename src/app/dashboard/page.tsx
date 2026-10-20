import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/styles/Dashboard.module.css";
import { DashboardController } from "@/controllers/dashboardController";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso, type ClavePrivilegio } from "@/lib/permisos";
import PanelAdmin from "@/components/PanelAdmin/PanelAdmin";
import EncabezadoPanel from "@/components/PanelAdmin/EncabezadoPanel";
import Icono, { type NombreIcono } from "@/components/Icono/Icono";

const ACCESOS: { href: string; titulo: string; texto: string; permiso: ClavePrivilegio; icono: NombreIcono }[] = [
  { href: "/admin/noticias", titulo: "Noticias", texto: "Publica comunicados, avisos y adjunta documentos.", permiso: "noticias", icono: "megafono" },
  { href: "/admin/ferias", titulo: "Ferias", texto: "Fechas, lugar y empresas participantes.", permiso: "ferias", icono: "tienda" },
  { href: "/admin/sorteos", titulo: "Sorteos", texto: "Premios, fecha y lugar de cada sorteo.", permiso: "sorteos", icono: "regalo" },
  { href: "/admin/directorio", titulo: "Directorio", texto: "Dirigentes, cargos y datos de contacto.", permiso: "directorio", icono: "grupo" },
  { href: "/admin/usuarios", titulo: "Usuarios", texto: "Cuentas del panel y sus privilegios.", permiso: "usuarios", icono: "usuario" },
];

export default async function DashboardPage() {
  // 🔐 Verificación de sesión propia de la página: no depende del
  // middleware, así que protege /dashboard aunque el middleware falle.
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const { totalNoticias, totalEventos, totalSorteos, ultimasNoticias } =
    await DashboardController.obtenerResumen();

  const cifras: { numero: number; texto: string; href: string; enlace: string; icono: NombreIcono; permiso: ClavePrivilegio }[] = [
    { numero: totalNoticias, texto: "Noticias publicadas", href: "/admin/noticias", enlace: "Ver todas", icono: "megafono", permiso: "noticias" },
    { numero: totalEventos, texto: "Ferias activas", href: "/admin/ferias", enlace: "Gestionar", icono: "tienda", permiso: "ferias" },
    { numero: totalSorteos, texto: "Sorteos activos", href: "/admin/sorteos", enlace: "Ver sorteos", icono: "regalo", permiso: "sorteos" },
  ];
  const nombre = usuario.nombre.trim().split(/\s+/)[0];

  return (
    <PanelAdmin usuario={usuario}>
      <EncabezadoPanel
        titulo={`Hola, ${nombre}`}
        descripcion="Este es el panel administrativo del SITECORPAC. Elige qué quieres publicar o actualizar."
      />

      <ul className={styles.cifras}>
        {cifras.map((c) => (
          <li key={c.href} className={styles.cifra}>
            <span className={styles.cifraIcono}>
              <Icono nombre={c.icono} />
            </span>
            <span className={styles.cifraNumero}>{c.numero}</span>
            <span className={styles.cifraTexto}>{c.texto}</span>
            {tienePermiso(usuario, c.permiso) && (
              <Link href={c.href} className={styles.cifraEnlace}>
                {c.enlace}
                <Icono nombre="flecha" chico />
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.columnas}>
        <section className={styles.bloque} aria-labelledby="accesos-titulo">
          <h2 id="accesos-titulo">¿Qué quieres hacer?</h2>
          <ul className={styles.accesos}>
            {ACCESOS.filter((a) => tienePermiso(usuario, a.permiso)).map((a) => (
              <li key={a.href}>
                <Link href={a.href} className={styles.acceso}>
                  <span className={styles.accesoIcono}>
                    <Icono nombre={a.icono} />
                  </span>
                  <span>
                    <span className={styles.accesoTitulo}>{a.titulo}</span>
                    <span className={styles.accesoTexto}>{a.texto}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.bloque} aria-labelledby="ultimas-titulo">
          <h2 id="ultimas-titulo">Últimas noticias</h2>
          {ultimasNoticias.length === 0 ? (
            <p className={styles.vacio}>Todavía no hay noticias publicadas.</p>
          ) : (
            <ul className={styles.ultimas}>
              {ultimasNoticias.map((n) => (
                <li key={n.id}>
                  <Icono nombre="documento" chico />
                  <span>{n.titulo}</span>
                </li>
              ))}
            </ul>
          )}
          <a href="/noticias" target="_blank" rel="noopener noreferrer" className={styles.verPublico}>
            Ver cómo se ven en el sitio
            <Icono nombre="externo" chico />
            <span className="sr-only"> (abre en una pestaña nueva)</span>
          </a>
        </section>
      </div>
    </PanelAdmin>
  );
}
