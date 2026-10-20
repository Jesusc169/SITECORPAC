"use client";

import { useEffect, useState } from "react";
import FeriasView, { EventoFeria } from "@/views/FeriasView";
import { fetchFerias } from "@/services/eventoFerias.service";

export default function FeriasClient() {
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [anio, setAnio] = useState<number | null>(null);
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [loading, setLoading] = useState(true);

  /* =====================================================
     PRIMERA CARGA → años reales desde la BD; se elige el más reciente
  ===================================================== */
  useEffect(() => {
    let mounted = true;

    fetchFerias()
      .then((res) => {
        if (!mounted || !Array.isArray(res)) return;
        const aniosUnicos = Array.from(new Set(res.map((f) => f.anio))).sort((a, b) => b - a);
        setAniosDisponibles(aniosUnicos);
        setAnio(aniosUnicos[0] ?? null);
      })
      .catch((error) => {
        console.error("Error cargando ferias:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     CARGA POR AÑO (incluye "Ver todas")
  ===================================================== */
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchFerias(anio ?? undefined)
      .then((res) => {
        if (mounted) setFerias(Array.isArray(res) ? res : []);
      })
      .catch((error) => {
        console.error("Error cargando ferias:", error);
        if (mounted) setFerias([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [anio]);

  return (
    <FeriasView
      feriasList={ferias}
      aniosDisponibles={aniosDisponibles}
      anioSeleccionado={anio}
      onChangeAnio={setAnio}
      loading={loading}
    />
  );
}
