"use client";
import Sidebar from "../../components/Sidebar/Sidebar";

import styles from "../../styles/Dashboard.module.css";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Panel Administrativo del SITECORPAC</h1>
            <p>
              Bienvenida, Secretaria. Aquí podrás visualizar un resumen general de las actividades y 
              gestionar los módulos según tus permisos.
            </p>
          </div>

          {/* Tarjetas de resumen */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>📰 Noticias publicadas</h3>
              <p className={styles.statNumber}>12</p>
              <Link href="/admin/noticias" className={styles.link}>
                Ver todas →
              </Link>
            </div>

            <div className={styles.statCard}>
              <h3>🎉 Actividades próximas</h3>
              <p className={styles.statNumber}>2</p>
              <Link href="/admin/actividades" className={styles.link}>
                Gestionar →
              </Link>
            </div>

            <div className={styles.statCard}>
              <h3>🧾 Solicitudes en revisión</h3>
              <p className={styles.statNumber}>5</p>
              <Link href="/admin/tramites" className={styles.link}>
                Revisar →
              </Link>
            </div>

            <div className={styles.statCard}>
              <h3>📑 Documentos subidos</h3>
              <p className={styles.statNumber}>28</p>
              <Link href="/admin/documentos" className={styles.link}>
                Ver documentos →
              </Link>
            </div>
          </div>

          {/* Últimas actividades */}
          <div className={styles.section}>
            <h2>📅 Últimas actualizaciones</h2>
            <ul className={styles.activityList}>
              <li>✅ Nueva noticia publicada: “Convenio colectivo 2025”.</li>
              <li>🧍 Se actualizó el directorio sindical.</li>
              <li>📄 Se añadió la Ley de Seguridad y Salud 2025.</li>
              <li>🎊 Se programó la Feria de Bienestar 2025.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
