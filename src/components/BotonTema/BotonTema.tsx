"use client";

import { useEffect, useState } from "react";
import Icono from "@/components/Icono/Icono";

type Tema = "light" | "dark";
const CLAVE = "sitecorpac-tema";

/**
 * Script que corre en <head> ANTES de pintar la página: aplica el tema
 * guardado (o el del sistema, si nunca se eligió) para que no parpadee en
 * blanco al cargar en modo oscuro. Bootstrap usa data-bs-theme; nuestros
 * estilos, data-theme (ver styles/global.css).
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CLAVE}");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.setAttribute("data-theme",t);d.setAttribute("data-bs-theme",t)}catch(e){}})();`;

function aplicar(tema: Tema) {
  const d = document.documentElement;
  d.setAttribute("data-theme", tema);
  d.setAttribute("data-bs-theme", tema);
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // Sin almacenamiento (modo privado): el cambio dura hasta recargar.
  }
}

/** Botón sol/luna para cambiar entre tema claro y oscuro. */
export default function BotonTema({ className = "" }: Readonly<{ className?: string }>) {
  // null hasta montar: en el servidor no se sabe qué tema eligió la persona.
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee el tema que puso SCRIPT_TEMA, solo existe en el navegador
    setTema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const oscuro = tema === "dark";
  const cambiar = () => {
    const nuevo: Tema = oscuro ? "light" : "dark";
    aplicar(nuevo);
    setTema(nuevo);
  };

  return (
    <button
      type="button"
      className={`boton-tema ${className}`}
      onClick={cambiar}
      aria-label="Tema oscuro"
      aria-pressed={oscuro}
      title={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <Icono nombre={oscuro ? "sol" : "luna"} chico />
    </button>
  );
}
