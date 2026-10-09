import { defineConfig, devices } from "@playwright/test";
import { urlBasePrueba } from "./tests/urlBasePrueba";

/**
 * Pruebas de punta a punta de las PANTALLAS (npm run test:e2e).
 * Arranca el sitio compilado contra la base de PRUEBA (nunca la real) en el
 * puerto 3200. Antes, e2e/preparar.mjs la deja con datos de ejemplo.
 */
const PUERTO = 3200;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: urlBasePrueba(),
      JWT_SECRET: "secreto-solo-para-e2e",
      NEXT_PUBLIC_BASE_URL: `http://localhost:${PUERTO}`,
    },
  },
});
