// app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Script from "next/script";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SITECORPAC",
  description: "Sindicato de Trabajadores de CORPAC",
  icons: {
    icon: "/logo_site.jpg", // asegúrate que exista en /public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body>
        {children}

        {/* Bootstrap JS con bundle (Popper incluido) */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
