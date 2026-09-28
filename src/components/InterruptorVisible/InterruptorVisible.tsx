"use client";

import { useId } from "react";

interface Props {
  visible: boolean;
  onChange: (visible: boolean) => void;
  /** "noticia", "feria" o "sorteo": se usa en el texto de ayuda. */
  tipo: string;
  /** true para sustantivos masculinos ("este sorteo", "ocultarlo"). */
  masculino?: boolean;
}

// Interruptor "Visible en el sitio web" compartido por los formularios de
// noticias, ferias y sorteos. Apagado = el registro se guarda pero no aparece
// en el sitio público (se puede volver a encender cuando se quiera).
export default function InterruptorVisible({ visible, onChange, tipo, masculino = false }: Props) {
  const id = useId();
  const ayudaId = `${id}-ayuda`;
  const este = masculino ? "este" : "esta";
  const lo = masculino ? "lo" : "la";
  const guardado = masculino ? "guardado" : "guardada";
  const oculto = masculino ? "Oculto" : "Oculta";

  return (
    <div className="mb-3 p-3 rounded" style={{ background: visible ? "#e6f4ea" : "#fdf3dd" }}>
      <div className="form-check form-switch m-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={id}
          checked={visible}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={ayudaId}
          style={{ cursor: "pointer", width: "2.6em", height: "1.3em" }}
        />
        <label className="form-check-label fw-semibold ms-2" htmlFor={id} style={{ cursor: "pointer" }}>
          {visible ? "Visible en el sitio web" : `${oculto}: no se muestra en el sitio web`}
        </label>
      </div>
      <div id={ayudaId} className="form-text mt-1" style={{ color: "#40566d" }}>
        {visible
          ? `Los afiliados verán ${este} ${tipo}. Apaga el interruptor para ocultar${lo} sin borrar${lo}.`
          : `${este[0].toUpperCase()}${este.slice(1)} ${tipo} queda ${guardado} en el panel, pero nadie ${lo} ve en el sitio. Enciende el interruptor para volver a mostrar${lo}.`}
      </div>
    </div>
  );
}
