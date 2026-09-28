// Etiqueta de estado para las tablas del panel: "Visible" (verde) u
// "Oculta"/"Oculto" (ámbar). El texto acompaña al color para no depender
// solo del color (accesibilidad).
export default function EtiquetaVisible({ visible, masculino = false }: { visible: boolean; masculino?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.8rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: visible ? "#e6f4ea" : "#fdf3dd",
        color: visible ? "#15803d" : "#8a5a00",
      }}
    >
      {visible ? "● Visible" : masculino ? "○ Oculto" : "○ Oculta"}
    </span>
  );
}
