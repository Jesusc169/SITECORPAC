import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Permite optimización automática
    unoptimized: false,

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