/**
 * Se ejecuta una vez antes de todos los tests: deja la base de PRUEBA con el
 * esquema actual de prisma/schema.prisma.
 *
 * Por seguridad se niega a correr si el nombre de la base no termina en
 * "_test": así una URL mal puesta nunca puede vaciar la base real.
 */
import { execSync } from "child_process";
import { urlBasePrueba } from "./urlBasePrueba";

export default function setup() {
  const url = urlBasePrueba();
  const base = url.split("/").pop()?.split("?")[0] ?? "";
  if (!base.endsWith("_test")) {
    throw new Error(
      `La base de pruebas debe terminar en "_test" (es "${base}"). Revisa TEST_DATABASE_URL o .env.test.`
    );
  }
  // Sin --force-reset: cada test vacía las tablas que usa (limpiarBD), así
  // que aquí solo hace falta dejar el esquema al día.
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
