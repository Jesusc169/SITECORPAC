"use client";

import Sidebar from "@/components/Sidebar/Sidebar";
import FeriasView from "./FeriasView";
import styles from "./ferias.admin.module.css";

export default function Page() {
  return (
    <div className={styles.adminWrapper}>
      <Sidebar />

      <div className={styles.panelContainer}>
        <FeriasView />
      </div>
    </div>
  );
}
