import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔹 Ignora errores de ESLint durante la build de producción
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🔹 Otras opciones de Next.js que puedas tener
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
