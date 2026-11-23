import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ya viene en formato "flat config" (antes se cargaba
// con FlatCompat). El .eslintrc.json viejo no lo leía ESLint 9: se eliminó.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Los scripts de mantenimiento se corren a mano con `node scripts/x.js`
    // en el servidor y son CommonJS (el proyecto no es "type": "module"):
    // ahí require() es lo correcto. Solo afecta a esa carpeta.
    files: ["scripts/**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores(["node_modules/**", ".next/**", ".claude/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
