"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import FeriasView, { EventoFeria, Empresa } from "@/views/FeriasView";
import styles from "./ferias.admin.module.css";
import { prisma } from "@/lib/prisma";

export default function Page() {
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const feriasRaw = await prisma.evento_feria.findMany({
          where: { estado: true },
          include: {
            evento_feria_empresa: { include: { empresa: true } },
            evento_feria_fecha: true,
          },
          orderBy: { created_at: "desc" },
        });

        const empresasSet = new Map<number, Empresa>();
        feriasRaw.forEach((f) =>
          f.evento_feria_empresa.forEach((e) =>
            empresasSet.set(e.empresa.id, {
              id: e.empresa.id,
              nombre: e.empresa.nombre,
              logo_url: e.empresa.logo_url,
            })
          )
        );

        const feriasData: EventoFeria[] = feriasRaw.map((f) => ({
          id: f.id,
          titulo: f.titulo,
          descripcion: f.descripcion,
          anio: f.anio,
          imagen_portada: f.imagen_portada,
          evento_feria_empresa: f.evento_feria_empresa.map((e) => ({
            empresa: {
              id: e.empresa.id,
              nombre: e.empresa.nombre,
              logo_url: e.empresa.logo_url,
            },
          })),
          evento_feria_fecha: f.evento_feria_fecha.map((fecha) => ({
            id: fecha.id,
            fecha: fecha.fecha.toISOString(),
            hora_inicio: fecha.hora_inicio,
            hora_fin: fecha.hora_fin,
            ubicacion: fecha.ubicacion,
            zona: fecha.zona,
          })),
        }));

        setFerias(feriasData);
        setEmpresas(Array.from(empresasSet.values()));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar los datos de ferias");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className={styles.adminWrapper}>
      <Sidebar />
      <div className={styles.panelContainer}>
        {loading && <p>Cargando datos...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {!loading && !error && (
          <FeriasView
            feriasList={ferias}
            empresasList={empresas}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
