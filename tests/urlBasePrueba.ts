import { existsSync, readFileSync } from "fs";

/**
 * URL de la base de PRUEBA: TEST_DATABASE_URL (en CI) o .env.test (local, no
 * se sube al repo). Nunca .env: los tests de integración vacían esta base.
 */
export function urlBasePrueba(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (existsSync(".env.test")) {
    const m = readFileSync(".env.test", "utf8").match(/^TEST_DATABASE_URL="?([^"\r\n]+)"?/m);
    if (m) return m[1];
  }
  return "mysql://root:root@localhost:3306/sitecorpac_test";
}
