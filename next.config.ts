import type { NextConfig } from "next";

// El sitio solo carga un recurso externo: el bundle JS de Bootstrap desde
// jsdelivr (ver app/layout.tsx). Las fuentes de Google se autohospedan por
// next/font en build time, así que no necesitan permiso aparte en la CSP.
// En dev, React/Next necesitan eval() para HMR y stack traces del debugger;
// sin 'unsafe-eval' aquí la consola muestra un error de CSP al arrancar
// `next dev` (no ocurre en producción, donde next build no usa eval()).
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net${
    process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

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
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
          // 180 días, sin includeSubDomains: el dominio ya es 100% HTTPS,
          // pero no forzamos subdominios que no controlamos desde aquí.
          { key: "Strict-Transport-Security", value: "max-age=15552000" },
        ],
      },
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