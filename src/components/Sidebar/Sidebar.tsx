"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname() || "/";

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <aside className={styles.sidebar} aria-label="Panel de administración">
      <div className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo_site.jpg" alt="SITE CORPAC" className={styles.brandLogo} />
          <span className={styles.brandText}>SITECORPAC</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Administración">
        <ul>
          <li>
            <Link 
              href="/admin/noticias" 
              className={`${styles.link} ${isActive("/admin/noticias") ? styles.active : ""}`}
            >
              Administrar noticias
            </Link>
          </li>
          <li>
            <Link href="/admin/directorio" className={`${styles.link} ${isActive("/admin/directorio") ? styles.active : ""}`}>
              Administrar directorio
            </Link>
          </li>
          <li>
            <Link href="/admin/ferias" className={`${styles.link} ${isActive("/admin/ferias") ? styles.active : ""}`}>
              Administrar ferias
            </Link>
          </li>
          <li>
            <Link href="/admin/sorteos" className={`${styles.link} ${isActive("/admin/sorteos") ? styles.active : ""}`}>
              Administrar sorteos
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.footer}>
        <small>SITECORPAC • Panel administrativo</small>
      </div>
    </aside>
  );
}
