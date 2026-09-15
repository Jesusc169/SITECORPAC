"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";
import { tienePermiso, type ClavePrivilegio } from "@/lib/permisos";

const ITEMS_MENU: { href: string; label: string; permiso: ClavePrivilegio }[] = [
  { href: "/admin/noticias", label: "Administrar noticias", permiso: "noticias" },
  { href: "/admin/directorio", label: "Administrar directorio", permiso: "directorio" },
  { href: "/admin/ferias", label: "Administrar ferias", permiso: "ferias" },
  { href: "/admin/sorteos", label: "Administrar sorteos", permiso: "sorteos" },
  { href: "/admin/usuarios", label: "Administrar usuarios", permiso: "usuarios" },
];

interface UsuarioActual {
  rol: string;
  permisos: unknown;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);

  useEffect(() => {
    fetch("/api/administrador/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUsuario(data))
      .catch(() => setUsuario(null));
  }, []);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

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

    // Navegación del lado del cliente: evita recargar todo el JS/CSS
    // (eso era lo que causaba el retraso al escribir justo después de salir)
    // y router.replace también evita volver con "atrás".
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {/* Toggle (mobile) */}
      <button
        className={styles.toggleBtn}
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${open ? styles.open : ""}`}
      >
        <div>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.brand}>
              <img
                src="/logo_site.jpg"
                alt="SITECORPAC"
                className={styles.brandLogo}
              />
              <span className={styles.brandText}>
                SITECORPAC
              </span>
            </div>
          </div>

          {/* Botón Inicio */}
          <div className={styles.homeWrapper}>
            <Link
              href="/dashboard"
              className={`${styles.homeBtn} ${
                isActive("/dashboard") ? styles.activeHome : ""
              }`}
              onClick={() => setOpen(false)}
            >
              Inicio
            </Link>
          </div>

          {/* Navegación */}
          <nav className={styles.nav}>
            <ul>
              {ITEMS_MENU.filter((item) => tienePermiso(usuario, item.permiso)).map(
                (item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.link} ${
                        isActive(item.href) ? styles.active : ""
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>

          <div className={styles.footerText}>
            SITECORPAC • Panel administrativo
          </div>
        </div>
      </aside>
    </>
  );
}
