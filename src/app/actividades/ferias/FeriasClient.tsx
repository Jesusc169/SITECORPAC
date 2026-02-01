"use client";

import { useEffect, useState } from "react";
import FeriasView, { EventoFeria } from "@/views/FeriasView"; // ajusta ruta
import { fetchFerias } from "@/services/eventoFerias.service";

export default function FeriasClient() {
  const aniosDisponibles = [2026, 2025, 2024];

  const [anio, setAnio] = useState<number>(aniosDisponibles[0]);
  const [ferias, setFerias] = useState<EventoFeria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsTransitioning(true);
    setLoading(true);

    fetchFerias(anio)
      .then((res) => {
        if (isMounted) setFerias(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error("Error cargando ferias:", err);
        if (isMounted) setFerias([]);
      })
      .finally(() => {
        if (isMounted) {
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

  return (
    <FeriasView
      feriasList={ferias}
      aniosDisponibles={aniosDisponibles}
      anioSeleccionado={anio}
      onChangeAnio={(nuevoAnio) => {
        if (nuevoAnio !== null) setAnio(nuevoAnio);
      }}
      loading={loading}
      transitioning={isTransitioning}
    />
  );
}
