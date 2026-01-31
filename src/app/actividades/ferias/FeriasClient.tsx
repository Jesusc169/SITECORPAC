"use client";

import { useEffect, useState } from "react";
import FeriasView from "@/views/FeriasView";
import { fetchFerias } from "@/services/eventoFerias.service";

export default function FeriasClient() {
  /* =========================
     AÑOS DISPONIBLES
  ========================= */
  const aniosDisponibles = [2026, 2025, 2024];

  /* =========================
     ESTADOS
  ========================= */
  const [anio, setAnio] = useState<number>(aniosDisponibles[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  /* =========================
     EFECTO: CARGAR FERIAS
  ========================= */
  useEffect(() => {
    let isMounted = true;

    setIsTransitioning(true);
    setLoading(true);

    fetchFerias(anio)
      .then((res) => {
        if (isMounted) {
          setData(Array.isArray(res) ? res : []);
        }
      })
      .catch((err) => {
        console.error("Error cargando ferias:", err);
        if (isMounted) setData([]);
      })
      .finally(() => {
        if (isMounted) {
          // pequeña pausa para que la animación se sienta fluida
          setTimeout(() => {
            setLoading(false);
            setIsTransitioning(false);
          }, 200);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [anio]);

  /* =========================
     RENDER
  ========================= */
  return (
    <FeriasView
      data={data}
      aniosDisponibles={aniosDisponibles}
      anioSeleccionado={anio}
      onChangeAnio={(nuevoAnio: number | null) => {
        if (nuevoAnio !== null) setAnio(nuevoAnio);
      }}
      loading={loading}
      transitioning={isTransitioning} // ahora reconocido por TypeScript
    />
  );
}
