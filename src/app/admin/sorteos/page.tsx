"use client";

import Sidebar from "@/components/Sidebar/Sidebar";
import SorteosAdminClient from "./SorteosAdminClient";
import styles from "../ferias/ferias.admin.module.css"; 
// ⬆ reutilizamos el mismo layout admin (buena práctica)

export default function Page() {
  return (
    <div className={styles.adminWrapper}>
      <Sidebar />

      <div className={styles.panelContainer}>
        <SorteosAdminClient />
      </div>
    </div>
  );
}
