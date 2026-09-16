import path from "path";

export class ArchivoInvalidoError extends Error {}

const TIPOS_IMAGEN_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Rechaza cualquier archivo que no sea JPG/PNG/WEBP. Sin esto, un usuario con
 * permiso de un solo módulo (ej. "ferias") podía subir un .html o .svg como
 * "imagen" y quedaba servido tal cual por nginx desde el dominio de
 * sitecorpac.com, con su content-type real.
 */
export function validarImagen(file: File): void {
  if (!TIPOS_IMAGEN_PERMITIDOS.has(file.type)) {
    throw new ArchivoInvalidoError("Solo se permiten imágenes JPG, PNG o WEBP");
  }
}

/**
 * Descarta cualquier carpeta que venga en el nombre original (path.basename)
 * y deja solo caracteres seguros. Sin esto, un archivo con un nombre como
 * "../../../../etc/passwd" o "../../next.config.ts" se podía escribir fuera
 * de la carpeta de uploads, porque el nombre original se usaba casi tal cual
 * para construir la ruta en disco.
 */
export function nombreArchivoSeguro(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "archivo";
}
