"use client";

import { useEffect } from "react";

// Carga el JS de Bootstrap (menús desplegables, colapso del menú móvil,
// modales) desde el propio paquete npm en vez del CDN de jsDelivr: así el
// sitio no hace ninguna petición a terceros y la IP de los visitantes no
// sale hacia otro proveedor (ver /privacidad y /cookies).
export default function BootstrapClient() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}
