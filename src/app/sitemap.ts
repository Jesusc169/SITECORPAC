import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("http")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://sitecorpac.com";

const RUTAS_ESTATICAS = [
  "",
  "/noticias",
  "/actividades/ferias",
  "/actividades/sorteos",
  "/directorio",
  "/nuestra_historia",
  "/legislacion/constitucion",
  "/legislacion/estatuto",
  "/legislacion/ley-relaciones",
  "/legislacion/ley-seguridad",
  "/legislacion/oit",
  "/tramites/beneficio-fallecido",
  "/tramites/prestamos",
];

// Rutas públicas estáticas + una entrada por cada noticia publicada, para que
// Google indexe el detalle de cada noticia (no solo el listado).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = RUTAS_ESTATICAS.map((ruta) => ({
    url: `${BASE_URL}${ruta}`,
    lastModified: new Date(),
  }));

  const noticias = await prisma.noticia.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { fecha: "desc" },
  });

  const noticiasSitemap: MetadataRoute.Sitemap = noticias.map((n) => ({
    url: `${BASE_URL}/actividades/noticias/${n.id}`,
    lastModified: n.updatedAt,
  }));

  return [...estaticas, ...noticiasSitemap];
}
