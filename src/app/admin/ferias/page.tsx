"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import FeriasView from "./FeriasView";
import styles from "./ferias.admin.module.css";

export default function Page() {
  const [ferias, setFerias] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // Cargar ferias y empresas
  // =========================
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Ferias
        const feriasRes = await fetch("/api/administrador/ferias");
        if (!feriasRes.ok) throw new Error("Error al cargar ferias");
        const feriasData = await feriasRes.json();
        setFerias(feriasData);

        // Empresas
        const empresasRes = await fetch("/api/administrador/empresas");
        if (!empresasRes.ok) throw new Error("Error al cargar empresas");
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // =========================
  // Render
  // =========================
  return (
    <div className={styles.adminWrapper}>
      <Sidebar />
      <div className={styles.panelContainer}>
        
        {loading && <p>Cargando datos...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {!loading && !error && (
          <FeriasView
            data={ferias}
            empresasDisponibles={empresas}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
