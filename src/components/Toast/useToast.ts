"use client";

import { useCallback, useRef, useState } from "react";

export type ToastTipo = "exito" | "error";

export interface ToastMensaje {
  tipo: ToastTipo;
  texto: string;
}

// Hook chico para mostrar un mensaje de "guardado correctamente" / error
// tras crear, editar o eliminar algo en el panel admin (noticias, ferias,
// sorteos...). Cada pantalla admin tiene su propia instancia: no hay estado
// global compartido a propósito, para no acoplar módulos que no se conocen
// entre sí.
export function useToast(duracionMs = 4000) {
  const [toast, setToast] = useState<ToastMensaje | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback(
    (tipo: ToastTipo, texto: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ tipo, texto });
      timeoutRef.current = setTimeout(() => setToast(null), duracionMs);
    },
    [duracionMs]
  );

  const cerrarToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  return { toast, mostrarToast, cerrarToast };
}
