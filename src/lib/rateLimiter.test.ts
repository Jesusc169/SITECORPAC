import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  login_intento: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

import {
  estaBloqueado,
  registrarFallo,
  registrarExito,
  obtenerIp,
  depurarIntentosAntiguos,
} from "./rateLimiter";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.login_intento.delete.mockResolvedValue({});
  prismaMock.login_intento.deleteMany.mockResolvedValue({ count: 0 });
});

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/auth/login", { headers });
}

describe("obtenerIp", () => {
  it("confía en X-Real-IP (nginx la fija con $remote_addr, el cliente no la puede pisar)", () => {
    expect(obtenerIp(req({ "x-real-ip": "190.1.2.3" }))).toBe("190.1.2.3");
  });

  it("si no hay X-Real-IP, usa el ÚLTIMO valor de X-Forwarded-For (el que agrega nginx)", () => {
    expect(
      obtenerIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 190.9.9.9" }))
    ).toBe("190.9.9.9");
  });

  it("ignora IPs falsas que el cliente ponga primero en X-Forwarded-For", () => {
    // Antes del fix, esto devolvía "666.666.666.666" (el primer valor,
    // inventado por el atacante) y permitía rotar IPs falsas para saltarse
    // el bloqueo por fuerza bruta en /api/auth/login.
    const resultado = obtenerIp(req({ "x-forwarded-for": "666.666.666.666, 190.9.9.9" }));
    expect(resultado).not.toBe("666.666.666.666");
    expect(resultado).toBe("190.9.9.9");
  });

  it("devuelve 'desconocida' si no hay ningún header de IP", () => {
    expect(obtenerIp(req({}))).toBe("desconocida");
  });
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

describe("depurarIntentosAntiguos", () => {
  it("borra los registros de más de 24 horas (plazo declarado en /privacidad)", async () => {
    const antes = Date.now();
    await depurarIntentosAntiguos();

    const filtro = prismaMock.login_intento.deleteMany.mock.calls[0][0];
    const limite = filtro.where.primerFalloEn.lt.getTime();
    expect(antes - limite).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 50);
    expect(antes - limite).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 50);
  });

  it("se ejecuta en cada comprobación de bloqueo", async () => {
    prismaMock.login_intento.findUnique.mockResolvedValue(null);
    await estaBloqueado("1.2.3.4");
    expect(prismaMock.login_intento.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("si la depuración falla, el login no se cae", async () => {
    prismaMock.login_intento.deleteMany.mockRejectedValue(new Error("DB caída"));
    prismaMock.login_intento.findUnique.mockResolvedValue(null);
    await expect(estaBloqueado("1.2.3.4")).resolves.toBeNull();
  });
});

describe("registrarExito", () => {
  it("borra cualquier registro de intentos fallidos para esa IP", async () => {
    await registrarExito("1.2.3.4");
    expect(prismaMock.login_intento.delete).toHaveBeenCalledWith({ where: { ip: "1.2.3.4" } });
  });
});
