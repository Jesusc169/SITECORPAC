import type { Metadata } from "next";
import PaginaPublica from "@/components/PaginaPublica/PaginaPublica";
import { NoticiasController } from "@/controllers/noticiasController";
import SorteosClient from "./SorteosClient";

export const metadata: Metadata = {
  title: "Sorteos | SITECORPAC",
  description: "Sorteos especiales del SITECORPAC en fechas conmemorativas.",
};

export default async function Page() {
  // La noticia más reciente se sugiere cuando no hay sorteos que mostrar.
  const [n] = await NoticiasController.obtenerNoticias();
  const noticia = n
    ? {
        id: n.id,
        titulo: n.titulo,
        imagen: n.imagen,
        fecha: typeof n.fecha === "string" ? n.fecha : n.fecha.toISOString(),
      }
    : null;

  return (
    <PaginaPublica>
      <SorteosClient noticia={noticia} />
    </PaginaPublica>
  );
}
