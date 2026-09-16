"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./InactivityGuard.module.css";

// Tiempo sin mover mouse/teclado antes de mostrar el aviso.
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 minutos
// Tiempo que tiene para reaccionar al aviso antes de cerrar sesión sola.
const TIEMPO_RESPUESTA_MS = 60 * 1000; // 60 segundos

const EVENTOS_ACTIVIDAD = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export default function InactivityGuard() {
  const router = useRouter();
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(TIEMPO_RESPUESTA_MS / 1000);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cuentaRegresiva = useRef<ReturnType<typeof setInterval> | null>(null);

  const cerrarSesion = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // si falla la llamada, igual lo mandamos a /login
    }
    router.replace("/login");
  }, [router]);

  const iniciarCuentaRegresiva = useCallback(() => {
    setMostrarAviso(true);
    setSegundosRestantes(TIEMPO_RESPUESTA_MS / 1000);

    cuentaRegresiva.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          if (cuentaRegresiva.current) clearInterval(cuentaRegresiva.current);
          cerrarSesion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cerrarSesion]);

  const reiniciarTimerInactividad = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(iniciarCuentaRegresiva, TIEMPO_INACTIVIDAD_MS);
  }, [iniciarCuentaRegresiva]);

  // Cualquier movimiento de mouse o tecla —incluso mientras se ve el
  // aviso— cuenta como "sigo aquí": cancela la cuenta regresiva, oculta
  // el aviso y reinicia el reloj de inactividad.
  const manejarActividad = useCallback(() => {
    if (cuentaRegresiva.current) {
      clearInterval(cuentaRegresiva.current);
      cuentaRegresiva.current = null;
    }
    setMostrarAviso(false);
    reiniciarTimerInactividad();
  }, [reiniciarTimerInactividad]);

  useEffect(() => {
    reiniciarTimerInactividad();
    EVENTOS_ACTIVIDAD.forEach((evento) =>
      window.addEventListener(evento, manejarActividad, { passive: true })
    );

    return () => {
      EVENTOS_ACTIVIDAD.forEach((evento) =>
        window.removeEventListener(evento, manejarActividad)
      );
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (cuentaRegresiva.current) clearInterval(cuentaRegresiva.current);
    };
  }, [manejarActividad, reiniciarTimerInactividad]);

  if (!mostrarAviso) return null;

  return (
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactividad-titulo"
    >
      <div className={styles.modal}>
        <h2 id="inactividad-titulo" className={styles.titulo}>
          ¿Sigues ahí?
        </h2>
        <p className={styles.texto}>
          Tu sesión se cerrará por inactividad en{" "}
          <span className={styles.contador}>{segundosRestantes}</span>{" "}
          {segundosRestantes === 1 ? "segundo" : "segundos"}.
        </p>
        <button type="button" className={styles.boton} onClick={manejarActividad}>
          Sigo aquí
        </button>
      </div>
    </div>
  );
}
