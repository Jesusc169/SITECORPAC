"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";
import Icono, { type NombreIcono } from "@/components/Icono/Icono";
import { tienePermiso, type ClavePrivilegio } from "@/lib/permisos";

// Los textos de los enlaces no cambian con el rediseño: las secretarias y el
// manual los conocen así (y las pruebas E2E los buscan por nombre).
const ITEMS_MENU: { href: string; label: string; permiso: ClavePrivilegio; icono: NombreIcono }[] = [
  { href: "/admin/noticias", label: "Administrar noticias", permiso: "noticias", icono: "megafono" },
  { href: "/admin/directorio", label: "Administrar directorio", permiso: "directorio", icono: "grupo" },
  { href: "/admin/ferias", label: "Administrar ferias", permiso: "ferias", icono: "tienda" },
  { href: "/admin/sorteos", label: "Administrar sorteos", permiso: "sorteos", icono: "regalo" },
  { href: "/admin/usuarios", label: "Administrar usuarios", permiso: "usuarios", icono: "usuario" },
];

export interface UsuarioPanel {
  nombre: string;
  rol: string;
  permisos: unknown;
}

/**
 * Menú lateral del panel (rediseño A+C): blanco, con la franja de colores del
 * logo arriba como la cabecera del sitio público. En pantallas chicas se
 * vuelve una barra superior con botón de menú.
 */
export default function Sidebar({ usuario }: Readonly<{ usuario: UsuarioPanel }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Al cambiar de pantalla se cierra el menú del celular.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }

    localStorage.clear();
    sessionStorage.clear();

    // Navegación del lado del cliente: evita recargar el JS/CSS completo
    // (eso era lo que causaba el retraso al escribir justo después de salir)
    // y router.replace también evita volver con "atrás".
    router.replace("/login");
    router.refresh();
  };

  const enlace = (href: string, label: string, icono: NombreIcono) => (
    <Link
      href={href}
      className={`${styles.link} ${isActive(href) ? styles.active : ""}`}
      aria-current={isActive(href) ? "page" : undefined}
    >
      <Icono nombre={icono} chico />
      {label}
    </Link>
  );

  return (
    <>
      {/* Barra superior (celular y tablet) */}
      <header className={styles.barraMovil}>
        <span className={styles.strip} />
        <div className={styles.barraMovilIn}>
          <Link href="/dashboard" className={styles.brand}>
            <img src="/logo_site.jpg" alt="" width={38} height={38} />
            <span className={styles.bname}>SITECORPAC</span>
          </Link>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>

      {open && (
        <button type="button" className={styles.overlay} onClick={() => setOpen(false)} aria-label="Cerrar menú" />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <span className={styles.strip} />

        <div className={styles.header}>
          <Link href="/dashboard" className={styles.brand}>
            <img src="/logo_site.jpg" alt="" width={46} height={46} />
            <span>
              <span className={styles.bname}>SITECORPAC</span>
              <span className={styles.bsub}>Panel administrativo</span>
            </span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Panel administrativo">
          <ul>
            <li>{enlace("/dashboard", "Inicio", "casa")}</li>
          </ul>
          <p className={styles.grupoTitulo}>Contenido</p>
          <ul>
            {ITEMS_MENU.filter((item) => tienePermiso(usuario, item.permiso)).map((item) => (
              <li key={item.href}>{enlace(item.href, item.label, item.icono)}</li>
            ))}
            {/* Solo el rol administrador: no es un privilegio asignable */}
            {usuario.rol === "administrador" && <li>{enlace("/admin/sistema", "Sistema y registros", "escudo")}</li>}
          </ul>
        </nav>

        <div className={styles.footer}>
          <div className={styles.cuenta}>
            <span className={styles.avatar} aria-hidden="true">
              {usuario.nombre.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className={styles.cuentaTexto}>
              <span className={styles.cuentaNombre}>{usuario.nombre}</span>
              <span className={styles.cuentaRol}>{usuario.rol}</span>
            </span>
          </div>

          <a href="/" target="_blank" rel="noopener noreferrer" className={styles.verSitio}>
            <Icono nombre="externo" chico />
            Ver el sitio público
            <span className="sr-only"> (abre en una pestaña nueva)</span>
          </a>

          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <Icono nombre="salir" chico />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
