// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * URL para el driver mariadb. Con DATABASE_SOCKET (en el servidor:
 * /var/run/mysqld/mysqld.sock) se conecta por el socket local de MySQL:
 * MySQL 8 lo considera un canal seguro y caching_sha2_password funciona
 * también justo después de reiniciar MySQL. Por TCP sin SSL, esa primera
 * conexión fallaría hasta que alguien entre por consola.
 */
export function urlConexion(url: string | undefined, socket: string | undefined): string {
  if (!url) throw new Error("Falta DATABASE_URL (revisa el archivo .env)");
  if (!socket) return url;
  const u = new URL(url);
  u.searchParams.set("socketPath", socket);
  return u.toString();
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma 7 se conecta con el driver de Node (mariadb, compatible con
    // MySQL) en vez del motor en Rust de Prisma 6.
    adapter: new PrismaMariaDb(urlConexion(process.env.DATABASE_URL, process.env.DATABASE_SOCKET)),
    // Cada consulta SQL solo en desarrollo: en producción llenaba el log de
    // PM2 con miles de líneas y en los tests tapaba los resultados.
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error", "warn"],
  });


if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
