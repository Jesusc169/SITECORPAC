import panel from "@/styles/PanelAdmin.module.css";

/**
 * Encabezado de cada pantalla del panel: rótulo pequeño en teal, título en
 * Lexend y una línea que explica para qué sirve la pantalla; a la derecha,
 * el botón principal ("+ Nueva noticia", etc.).
 */
export default function EncabezadoPanel({
  rotulo = "Panel administrativo",
  titulo,
  descripcion,
  children,
}: Readonly<{ rotulo?: string; titulo: string; descripcion?: string; children?: React.ReactNode }>) {
  return (
    <header className={panel.cabecera}>
      <div>
        <span className={panel.kick}>{rotulo}</span>
        <h1>{titulo}</h1>
        {descripcion && <p className={panel.descripcion}>{descripcion}</p>}
      </div>
      {children && <div className={panel.cabeceraAcciones}>{children}</div>}
    </header>
  );
}
