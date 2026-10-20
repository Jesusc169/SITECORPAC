import PaginaLegislacion, { type BloqueLegal, type ImagenLegal } from "@/components/Sitio/PaginaLegislacion";

type LeySeguridadViewProps = {
  data: {
    contenidos: BloqueLegal[];
  };
};

function imagenDe(c: BloqueLegal | undefined, alt: string): ImagenLegal | undefined {
  return c?.imagen ? { src: c.imagen, alt, tipo: "icono" } : undefined;
}

export default function LeySeguridadView({ data }: Readonly<LeySeguridadViewProps>) {
  return (
    <PaginaLegislacion
      ruta="/legislacion/ley-seguridad"
      titulo="Ley de Seguridad y Salud en el Trabajo"
      bloques={data.contenidos}
      boton={{ texto: "Ver normativa oficial", href: "https://www.gob.pe/institucion/mtpe/normas-legales" }}
      // Imágenes guardadas en la base (ley_seguridad_contenido.imagen): la
      // del primer bloque va arriba; todas se muestran enteras (la del
      // segundo bloque es el texto de la ley y no debe cortarse).
      principal={imagenDe(data.contenidos[0], "Implementos de seguridad: lentes, casco y guantes")}
      imagenesBloques={[
        undefined,
        imagenDe(data.contenidos[1], "Texto de la Ley N.º 29783"),
        imagenDe(data.contenidos[2], "Trabajador con su equipo de protección personal"),
      ]}
    />
  );
}
