import PaginaLegislacion from "@/components/Sitio/PaginaLegislacion";

interface Props {
  data: {
    ley: {
      titulo: string;
      descripcion: string;
      imagen?: string | null;
      enlace_pdf: string;
    } | null;
  };
}

export default function LeyRelacionesView({ data }: Readonly<Props>) {
  const { ley } = data;

  return (
    <PaginaLegislacion
      ruta="/legislacion/ley-relaciones"
      titulo={ley?.titulo ?? "Ley de Relaciones Colectivas de Trabajo"}
      bloques={ley ? [ley] : []}
      boton={ley ? { texto: "Descargar la ley (PDF)", href: ley.enlace_pdf, descarga: true } : undefined}
      principal={ley?.imagen ? { src: ley.imagen, alt: "Diario El Peruano en la sección de normas legales", tipo: "foto" } : undefined}
    />
  );
}
