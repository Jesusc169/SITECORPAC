import { describe, it, expect, vi, afterEach } from "vitest";

// Cliente de Prisma según el entorno (no se conecta: solo se crea).
const g = globalThis as unknown as { prisma?: unknown };
const env = process.env as Record<string, string | undefined>;
const original = { prisma: g.prisma, nodeEnv: env.NODE_ENV };

afterEach(() => {
  g.prisma = original.prisma;
  env.NODE_ENV = original.nodeEnv;
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
});
