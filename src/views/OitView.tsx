import PaginaLegislacion, { type BloqueLegal } from "@/components/Sitio/PaginaLegislacion";

type OitViewProps = {
  data: {
    contenidos: BloqueLegal[];
  };
};

export default function OitView({ data }: Readonly<OitViewProps>) {
  return (
    <PaginaLegislacion
      ruta="/legislacion/oit"
      titulo="Organización Internacional del Trabajo"
      bloques={data.contenidos}
      boton={{ texto: "Conoce más sobre la OIT", href: "https://www.ilo.org" }}
      principal={{ src: "/images/oit/logo-oit.png", alt: "Logo de la Organización Internacional del Trabajo", tipo: "icono" }}
      imagenesBloques={[
        undefined,
        { src: "/images/oit/silueta-personas.jpg", alt: "Esquema de una organización con representantes", tipo: "icono" },
        { src: "/images/oit/trabajo-digno.jpg", alt: "Trabajadores con maletín, símbolo del trabajo digno", tipo: "icono" },
      ]}
    />
  );
}
