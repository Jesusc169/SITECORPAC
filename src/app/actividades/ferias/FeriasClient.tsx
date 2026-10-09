"use client";

import { useEffect, useState } from "react";
import FeriasView, {
  EventoFeria,
  Empresa,
} from "@/views/FeriasView";
import { fetchFerias } from "@/services/eventoFerias.service";

/** Empresas de todas las ferias, sin repetir (para los logos de la página). */
function empresasUnicas(ferias: EventoFeria[]): Empresa[] {
  const porId = new Map<number, Empresa>();
  for (const feria of ferias) {
    for (const rel of feria.evento_feria_empresa) porId.set(rel.empresa.id, rel.empresa);
  }
  return Array.from(porId.values());
}

export default function FeriasClient() {
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [anio, setAnio] = useState<number | null>(null);
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  /* =====================================================
     🔥 PRIMERA CARGA → Obtener años reales desde BD
  ===================================================== */
  useEffect(() => {
    let mounted = true;

    fetchFerias()
      .then((res) => {
        if (!mounted) return;

        if (!Array.isArray(res)) {
          setFerias([]);
          setEmpresas([]);
          return;
        }

        // Extraer años únicos reales
        const aniosUnicos = Array.from(
          new Set(res.map((f) => f.anio))
        ).sort((a, b) => b - a);

        setAniosDisponibles(aniosUnicos);

        // Seleccionar el primer año disponible automáticamente
        if (aniosUnicos.length > 0) {
          setAnio(aniosUnicos[0]);
        } else {
          setAnio(null);
        }
      })
      .catch((error) => {
        console.error("Error cargando ferias:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     🔥 CARGA POR AÑO (incluye "Ver todas")
  ===================================================== */
  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setTransitioning(true);

    fetchFerias(anio ?? undefined)
      .then((res) => {
        if (!mounted) return;

        setFerias(res);
        setEmpresas(empresasUnicas(res));
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