import { describe, it, expect, vi, afterEach } from "vitest";

// Cliente de Prisma según el entorno (no se conecta: solo se crea).
const g = globalThis as unknown as { prisma?: unknown };
const env = process.env as Record<string, string | undefined>;
const original = { prisma: g.prisma, nodeEnv: env.NODE_ENV, url: env.DATABASE_URL };

afterEach(() => {
  g.prisma = original.prisma;
  env.NODE_ENV = original.nodeEnv;
  env.DATABASE_URL = original.url;
});

describe("lib/prisma", () => {
  it.each(["development", "production"])("se crea en %s; solo fuera de producción se reutiliza entre recargas", async (modo) => {
    delete g.prisma;
    env.NODE_ENV = modo;
    vi.resetModules();
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeTruthy();
    expect(g.prisma === prisma).toBe(modo !== "production");
  });

  it("con DATABASE_SOCKET se conecta por el socket de MySQL", async () => {
    const { urlConexion } = await import("@/lib/prisma");
    expect(urlConexion("mysql://u:p@localhost:3306/db", undefined)).toBe("mysql://u:p@localhost:3306/db");
    expect(urlConexion("mysql://u:p@localhost:3306/db", "/var/run/mysqld/mysqld.sock")).toBe(
      "mysql://u:p@localhost:3306/db?socketPath=%2Fvar%2Frun%2Fmysqld%2Fmysqld.sock"
    );
  });

  it("sin DATABASE_URL avisa claramente en vez de fallar más tarde", async () => {
    delete g.prisma;
    delete env.DATABASE_URL;
    vi.resetModules();
    await expect(import("@/lib/prisma")).rejects.toThrow("Falta DATABASE_URL");
  });
});
