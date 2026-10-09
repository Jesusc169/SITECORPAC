import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { urlBasePrueba } from "./tests/urlBasePrueba";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Los tests de integración comparten una sola base de datos de prueba:
    // un archivo a la vez para que no se pisen entre sí.
    pool: "forks",
    fileParallelism: false,
    globalSetup: ["tests/globalSetup.ts"],
    setupFiles: ["tests/setup.ts"],
    env: {
      DATABASE_URL: urlBasePrueba(),
      JWT_SECRET: "secreto-solo-para-tests",
    },
    // `npm run test:coverage` deja coverage/lcov.info, que lee SonarQube.
    // Se mide la LÓGICA (API, controladores, modelos, lib, services y el
    // middleware) y se exige el 100%. Las pantallas de React (páginas .tsx,
    // components, views, hooks) se prueban de punta a punta con Playwright
    // (carpeta e2e/), no con tests unitarios.
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "lcov"],
      include: [
        "src/app/api/**/*.ts",
        "src/app/robots.ts",
        "src/app/sitemap.ts",
        "src/controllers/**/*.ts",
        "src/models/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "middleware.ts",
      ],
      exclude: ["**/*.test.ts"],
      thresholds: { lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
