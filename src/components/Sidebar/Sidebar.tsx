"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleLogout = async () => {
    try {
      // Cierra sesión en backend (cookie / JWT)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }

    // Limpieza total de cliente
    localStorage.clear();
    sessionStorage.clear();

    // 🔥 IMPORTANTE: evita volver con "atrás"
    window.location.replace("/login");
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

          {/* Nav */}
          <nav className={styles.nav}>
            <ul>
              <li>
                <Link
                  href="/admin/noticias"
                  className={`${styles.link} ${
                    isActive("/admin/noticias") ? styles.active : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Administrar noticias
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/directorio"
                  className={`${styles.link} ${
                    isActive("/admin/directorio") ? styles.active : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Administrar directorio
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/ferias"
                  className={`${styles.link} ${
                    isActive("/admin/ferias") ? styles.active : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Administrar ferias
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/sorteos"
                  className={`${styles.link} ${
                    isActive("/admin/sorteos") ? styles.active : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Administrar sorteos
                </Link>
              </li>
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

          <div>
            SITECORPAC • Panel administrativo
          </div>
        </div>
      </aside>
    </>
  );
}
