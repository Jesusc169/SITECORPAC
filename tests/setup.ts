/**
 * Se carga antes de cada archivo de tests.
 *
 *  - next/headers: la cookie de sesión la controla cada test con
 *    `iniciarSesionComo()` / `cerrarSesion()` (tests/helpers.ts).
 *  - next/cache: sin servidor de Next, unstable_cache ejecuta la función
 *    directo y revalidateTag queda registrado para poder comprobarlo.
 *  - Cada archivo trabaja en una carpeta temporal propia (process.cwd()),
 *    así las fotos y PDFs que suben los tests no ensucian public/uploads.
 */
import { vi } from "vitest";
import { mkdtempSync, mkdirSync } from "fs";
import os from "os";
import path from "path";

export const cookiesDePrueba = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nombre: string) => {
      const v = cookiesDePrueba.get(nombre);
      return v === undefined ? undefined : { name: nombre, value: v };
    },
  }),
}));

export const etiquetasInvalidadas: string[] = [];

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
  revalidateTag: (tag: string) => {
    etiquetasInvalidadas.push(tag);
  },
}));

const dir = mkdtempSync(path.join(os.tmpdir(), "sitecorpac-test-"));
mkdirSync(path.join(dir, "public", "uploads"), { recursive: true });
process.chdir(dir);

// Los tests de "falla la base de datos" escriben errores a propósito: se
// silencian para que se vea el resultado. TEST_VERBOSE=1 los vuelve a mostrar.
if (!process.env.TEST_VERBOSE) {
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
}
