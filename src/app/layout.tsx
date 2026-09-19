// app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/global.css"; // tus estilos globales

import Script from "next/script";
import { Metadata } from "next";
import { Archivo } from "next/font/google";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sitecorpac.com"),
  title: "SITECORPAC",
  description: "Sindicato de Trabajadores de CORPAC",
  // El favicon lo genera Next automáticamente desde src/app/icon.png y
  // apple-icon.png (convención de archivos): un .jpg aquí no se mostraba
  // porque la mayoría de navegadores no soporta JPG como favicon.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={archivo.variable}>
      <head />
      <body>
        {children}

        {/* 🔹 Bootstrap JS Bundle (incluye Popper.js) para dropdowns, modals, tooltips, etc. */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
