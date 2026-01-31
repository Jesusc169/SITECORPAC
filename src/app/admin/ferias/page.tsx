"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import FeriasView from "./FeriasView";
import styles from "./ferias.admin.module.css";

/* ======================================================
   Tipos para FeriasView
====================================================== */
interface Empresa {
  id: number;
  nombre: string;
  logo_url: string;
}

interface EventoFeriaEmpresa {
  empresa: Empresa;
}

interface EventoFeriaFecha {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

interface EventoFeria {
  id: number;
  titulo: string;
  descripcion: string;
  anio: number;
  imagen_portada?: string | null;
  evento_feria_empresa: EventoFeriaEmpresa[];
  evento_feria_fecha: EventoFeriaFecha[];
}

interface FeriasViewProps {
  data: EventoFeria[];
  empresasDisponibles: Empresa[];
  loading: boolean;
}

export default function Page() {
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
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
        const feriasData: EventoFeria[] = await feriasRes.json();
        setFerias(feriasData);

        // Empresas
        const empresasRes = await fetch("/api/administrador/empresas");
        if (!empresasRes.ok) throw new Error("Error al cargar empresas");
        const empresasData: Empresa[] = await empresasRes.json();
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
