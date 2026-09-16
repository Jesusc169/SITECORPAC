import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  login_intento: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

import { estaBloqueado, registrarFallo, registrarExito } from "./rateLimiter";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.login_intento.delete.mockResolvedValue({});
});

describe("estaBloqueado", () => {
  it("no bloquea si no hay registro previo para esa IP", async () => {
    prismaMock.login_intento.findUnique.mockResolvedValue(null);
    expect(await estaBloqueado("1.2.3.4")).toBeNull();
  });

  it("bloquea mientras bloqueadoHasta siga en el futuro", async () => {
    const futuro = new Date(Date.now() + 60_000);
    prismaMock.login_intento.findUnique.mockResolvedValue({ bloqueadoHasta: futuro });

    const resultado = await estaBloqueado("1.2.3.4");
    expect(resultado).toBe(futuro.getTime());
  });

  it("libera y borra el registro cuando el bloqueo ya vencio", async () => {
    const pasado = new Date(Date.now() - 1000);
    prismaMock.login_intento.findUnique.mockResolvedValue({ bloqueadoHasta: pasado });

    const resultado = await estaBloqueado("1.2.3.4");
    expect(resultado).toBeNull();
    expect(prismaMock.login_intento.delete).toHaveBeenCalledWith({ where: { ip: "1.2.3.4" } });
  });
});

describe("registrarFallo", () => {
  it("en el 5to intento fallido dentro de la ventana, fija el bloqueo", async () => {
    prismaMock.login_intento.findUnique.mockResolvedValue({
      fallos: 4,
      primerFalloEn: new Date(),
      bloqueadoHasta: null,
    });

    await registrarFallo("1.2.3.4");

    const llamada = prismaMock.login_intento.update.mock.calls[0][0];
    expect(llamada.data.fallos).toBe(5);
    expect(llamada.data.bloqueadoHasta).not.toBeNull();
  });

  it("antes del 5to intento, cuenta el fallo pero no bloquea todavia", async () => {
    prismaMock.login_intento.findUnique.mockResolvedValue({
      fallos: 2,
      primerFalloEn: new Date(),
      bloqueadoHasta: null,
    });

    await registrarFallo("1.2.3.4");

    const llamada = prismaMock.login_intento.update.mock.calls[0][0];
    expect(llamada.data.fallos).toBe(3);
    expect(llamada.data.bloqueadoHasta).toBeNull();
  });

  it("si la ventana de 15 minutos ya paso, reinicia el conteo desde 1", async () => {
    const haceMediaHora = new Date(Date.now() - 30 * 60_000);
    prismaMock.login_intento.findUnique.mockResolvedValue({
      fallos: 4,
      primerFalloEn: haceMediaHora,
      bloqueadoHasta: null,
    });

    await registrarFallo("1.2.3.4");

    expect(prismaMock.login_intento.upsert).toHaveBeenCalled();
    const llamada = prismaMock.login_intento.upsert.mock.calls[0][0];
    expect(llamada.create.fallos).toBe(1);
  });
});

describe("registrarExito", () => {
  it("borra cualquier registro de intentos fallidos para esa IP", async () => {
    await registrarExito("1.2.3.4");
    expect(prismaMock.login_intento.delete).toHaveBeenCalledWith({ where: { ip: "1.2.3.4" } });
  });
});
