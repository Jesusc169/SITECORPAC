import PaginaLegislacion, { type BloqueLegal } from "@/components/Sitio/PaginaLegislacion";

type LeySeguridadViewProps = {
  data: {
    contenidos: BloqueLegal[];
  };
};

export default function LeySeguridadView({ data }: Readonly<LeySeguridadViewProps>) {
  return (
    <PaginaLegislacion
      ruta="/legislacion/ley-seguridad"
      titulo="Ley de Seguridad y Salud en el Trabajo"
      bloques={data.contenidos}
      boton={{ texto: "Ver normativa oficial", href: "https://www.gob.pe/institucion/mtpe/normas-legales" }}
    />
  );
}
