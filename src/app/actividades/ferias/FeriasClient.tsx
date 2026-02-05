"use client";

import { useEffect, useState } from "react";
import FeriasView, {
  EventoFeria,
  Empresa,
} from "@/views/FeriasView";
import { fetchFerias } from "@/services/eventoFerias.service";

export default function FeriasClient() {
  const aniosDisponibles = [2026, 2025, 2024];

  const [anio, setAnio] = useState<number | null>(aniosDisponibles[0]);
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setTransitioning(true);

    fetchFerias(anio ?? undefined)
      .then((res) => {
        if (!mounted) return;

        if (!Array.isArray(res)) {
          setFerias([]);
          setEmpresas([]);
          return;
        }

        setFerias(res);

        // =========================
        // EXTRAER EMPRESAS ÚNICAS
        // =========================
        const empresasMap = new Map<number, Empresa>();

        res.forEach((feria) => {
          feria.evento_feria_empresa.forEach((rel) => {
            empresasMap.set(rel.empresa.id, rel.empresa);
          });
        });

        setEmpresas(Array.from(empresasMap.values()));
      })
      .catch((error) => {
        console.error("Error cargando ferias:", error);
        if (mounted) {
          setFerias([]);
          setEmpresas([]);
        }
      })
      .finally(() => {
        if (!mounted) return;
        setTimeout(() => {
          setLoading(false);
          setTransitioning(false);
        }, 200);
      });

    return () => {
      mounted = false;
    };
  }, [anio]);

  return (
    <FeriasView
      feriasList={ferias}
      empresasList={empresas}
      aniosDisponibles={aniosDisponibles}
      anioSeleccionado={anio}
      onChangeAnio={setAnio}
      loading={loading}
      transitioning={transitioning}
    />
  );
}
