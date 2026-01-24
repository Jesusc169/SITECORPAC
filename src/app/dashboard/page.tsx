import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "@/styles/Dashboard.module.css";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  /* ===============================
     MÉTRICAS
  ================================ */
  const [
    totalNoticias,
    totalEventos,
    totalSorteos,
    totalDocumentos,
    ultimasNoticias,
  ] = await Promise.all([
    prisma.noticia.count(),
    prisma.evento_feria.count({
      where: { estado: true },
    }),
    prisma.sorteo.count({
      where: { estado: "ACTIVO" },
    }),
    prisma.estatuto_contenido.count(),
    prisma.noticia.findMany({
      take: 4,
      orderBy: { fecha: "desc" },
      select: { titulo: true },
    }),
  ]);

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
    </div>
  );
}
