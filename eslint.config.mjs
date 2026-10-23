import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ya viene en formato "flat config" (antes se cargaba
// con FlatCompat). El .eslintrc.json viejo no lo leía ESLint 9: se eliminó.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
