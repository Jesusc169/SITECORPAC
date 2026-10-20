import PaginaLegislacion, { type BloqueLegal } from "@/components/Sitio/PaginaLegislacion";

type ConstitucionViewProps = {
  data: {
    contenidos: BloqueLegal[];
  };
};

export default function ConstitucionView({ data }: Readonly<ConstitucionViewProps>) {
  return (
    <PaginaLegislacion
      ruta="/legislacion/constitucion"
      titulo="Constitución Política del Perú"
      bloques={data.contenidos}
      boton={{
        texto: "Consultar la Constitución",
        href: "https://www.gob.pe/institucion/presidencia/informes-publicaciones/196158-constitucion-politica-del-peru",
      }}
      lateral={{ src: "/images/constitucion/escudo-nacional.png", alt: "Escudo Nacional del Perú" }}
    />
  );
}
