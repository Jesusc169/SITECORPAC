// Configuración de la CLI de Prisma 7 (generate, db push). Prisma 7 ya no
// lee el .env solo: se carga aquí. La app no usa este archivo: se conecta
// con el adaptador de src/lib/prisma.ts.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // `prisma generate` no necesita conexión (en el CI no hay DATABASE_URL).
    url: process.env.DATABASE_URL ?? "",
  },
});
