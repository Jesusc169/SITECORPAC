// app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/global.css"; // tus estilos globales

import { Metadata } from "next";
import BootstrapClient from "@/components/BootstrapClient/BootstrapClient";
import { Lexend, Source_Sans_3 } from "next/font/google";

// Tipografía del rediseño A+C: Lexend para títulos y botones, Source Sans 3
// para el texto. next/font las descarga al compilar y las sirve desde el
// propio sitio (no se contacta a Google desde el navegador del visitante).
const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-titulos",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-texto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sitecorpac.com"),
  title: "SITECORPAC",
  description:
    "Sindicato Nacional Unificado de Trabajadores de CORPAC: noticias, trámites, ferias, sorteos y legislación laboral para sus afiliados.",
  // El favicon lo genera Next automáticamente desde src/app/icon.png y
  // apple-icon.png (convención de archivos): un .jpg aquí no se mostraba
  // porque la mayoría de navegadores no soporta JPG como favicon.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${lexend.variable} ${sourceSans.variable}`}>
      <head />
      <body>
        {children}

        {/* 🔹 Bootstrap JS Bundle (incluye Popper.js) para dropdowns, modals, tooltips, etc. */}
        <BootstrapClient />
      </body>
    </html>
  );
}
