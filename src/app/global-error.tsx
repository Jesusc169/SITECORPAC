"use client";

import { useEffect } from "react";

// Solo se activa si el error ocurre en el propio layout raíz (fuera del
// alcance de error.tsx). Por eso no puede depender de estilos globales ni de
// componentes como Navbar/Footer: debe traer su propio <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          padding: "90px 24px",
          color: "#1e293b",
        }}
      >
        <h1 style={{ color: "#b91c1c", marginBottom: 12 }}>
          Algo no salió bien
        </h1>
        <p style={{ color: "#64748b", marginBottom: 28 }}>
          Ya se registró el problema. Intenta recargar la página.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "12px 26px",
            borderRadius: 999,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#b91c1c",
            color: "#fff",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
