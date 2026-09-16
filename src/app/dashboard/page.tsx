import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "@/styles/Dashboard.module.css";
import { DashboardController } from "@/controllers/dashboardController";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InactivityGuard from "@/components/InactivityGuard/InactivityGuard";

export default async function DashboardPage() {
  // 🔐 Verificación de sesión propia de la página: no depende del
  // middleware, así que protege /dashboard aunque el middleware falle.
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) {
    redirect("/login");
  }

  /* ===============================
     MÉTRICAS
  ================================ */
  const { totalNoticias, totalEventos, totalSorteos, ultimasNoticias } =
    await DashboardController.obtenerResumen();

  return (
    <div className={styles.dashboard}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.container}>

          {/* ===============================
             HEADER
          ================================ */}
          <div className={styles.header}>
            <h1>Panel Administrativo</h1>
            <p>
              Sistema de gestión interna del SITECORPAC.
            </p>
          </div>

          {/* ===============================
             TARJETAS
          ================================ */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>📰 Noticias publicadas</h3>
              <p className={styles.statNumber}>{totalNoticias}</p>
              <Link href="/admin/noticias">Ver todas →</Link>
            </div>

            <div className={styles.statCard}>
              <h3>🎉 Eventos activos</h3>
              <p className={styles.statNumber}>{totalEventos}</p>
              <Link href="/admin/ferias">Gestionar →</Link>
            </div>

            <div className={styles.statCard}>
              <h3>🎁 Sorteos activos</h3>
              <p className={styles.statNumber}>{totalSorteos}</p>
              <Link href="/admin/sorteos">Ver sorteos →</Link>
            </div>

          </div>

          {/* ===============================
             ÚLTIMAS ACTIVIDADES
          ================================ */}
          <div className={styles.section}>
            <h2>📅 Últimas actualizaciones</h2>
            <ul className={styles.activityList}>
              {ultimasNoticias.map((n, i) => (
                <li key={i}>📰 {n.titulo}</li>
              ))}
            </ul>
          </div>

        </div>
      </main>

      <InactivityGuard />
    </div>
  );
}
