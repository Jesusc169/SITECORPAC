import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Desactivado: el optimizador interno de Next.js (/_next/image) hace un
    // auto-fetch a su propio servidor para leer archivos subidos en producción
    // (noticias/ferias/sorteos), y esa ruta interna puede quedar cacheada como
    // "no encontrada" si la imagen es nueva, dejando la foto rota hasta un
    // reinicio de PM2. nginx ya sirve /uploads y /images/uploads directo desde
    // disco (rápido y confiable), así que desactivamos el optimizador para no
    // depender de ese auto-fetch interno.
    unoptimized: true,

    // Formatos modernos automáticos
    formats: ["image/avif", "image/webp"],

    // Si usas dominio propio (aunque sea mismo host)
    domains: ["sitecorpac.com"],

    // Mejora cache de imágenes optimizadas
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
  },

  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;