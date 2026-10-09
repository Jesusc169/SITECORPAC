import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { sesionVigente } from "./auth";

describe("sesionVigente", () => {
  it("vale si la cuenta está activa y la versión coincide", () => {
    expect(sesionVigente({ sv: 2 }, { activo: true, sesionVersion: 2 })).toBe(true);
  });

  it("los tokens antiguos sin versión valen mientras la versión siga en 0", () => {
    expect(sesionVigente({}, { activo: true, sesionVersion: 0 })).toBe(true);
    expect(sesionVigente({}, { activo: true, sesionVersion: 1 })).toBe(false);
  });

  it("se corta al cambiar la contraseña o al cerrar sesiones (versión mayor)", () => {
    expect(sesionVigente({ sv: 1 }, { activo: true, sesionVersion: 2 })).toBe(false);
  });

  it("se corta si la cuenta fue desactivada o eliminada", () => {
    expect(sesionVigente({ sv: 0 }, { activo: false, sesionVersion: 0 })).toBe(false);
    expect(sesionVigente({ sv: 0 }, null)).toBe(false);
  });
});
