import PaginaLegislacion from "@/components/Sitio/PaginaLegislacion";

type Estatuto = {
  titulo: string;
  descripcion: string;
  enlace_pdf: string;
  imagen: string | null;
};

type EstatutoViewProps = {
  data: {
    estatuto: Estatuto | null;
  };
};

export default function EstatutoView({ data }: Readonly<EstatutoViewProps>) {
  const { estatuto } = data;

  return (
    <PaginaLegislacion
      ruta="/legislacion/estatuto"
      titulo={estatuto?.titulo ?? "Estatuto del SITECORPAC"}
      bloques={estatuto ? [estatuto] : []}
      boton={estatuto ? { texto: "Descargar el Estatuto (PDF)", href: estatuto.enlace_pdf, descarga: true } : undefined}
    />
  );
}
