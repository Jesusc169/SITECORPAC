import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));

import {
  calcularAlertas,
  leerFiltros,
  celdaCsv,
  SistemaValidationError,
} from "./sistemaController";

const GB = 1024 ** 3;
const AHORA = new Date("2026-10-08T20:00:00Z").getTime();
const sano = {
  discoTotal: 100 * GB,
  discoLibre: 90 * GB,
  memoriaTotal: 8 * GB,
  memoriaLibre: 6 * GB,
  diasCertificado: 80,
  errorCertificado: null,
  respaldosDisponibles: true,
  ultimoRespaldo: new Date(AHORA - 5 * 3600 * 1000).toISOString(),
  erroresUltimas24h: 0,
  ipsBloqueadas: 0,
  ahora: AHORA,
};

describe("calcularAlertas", () => {
  it("sin alertas cuando todo está bien", () => {
    expect(calcularAlertas(sano)).toEqual([]);
  });

  it("disco: aviso desde 80%, error desde 90%", () => {
    expect(calcularAlertas({ ...sano, discoLibre: 15 * GB })[0].gravedad).toBe("aviso");
    expect(calcularAlertas({ ...sano, discoLibre: 5 * GB })[0].gravedad).toBe("error");
  });

  it("certificado: aviso bajo 20 días, error bajo 7", () => {
    expect(calcularAlertas({ ...sano, diasCertificado: 15 })[0].gravedad).toBe("aviso");
    expect(calcularAlertas({ ...sano, diasCertificado: 3 })[0].gravedad).toBe("error");
  });

  it("respaldo de más de 36 horas es error", () => {
    const a = calcularAlertas({
      ...sano,
      ultimoRespaldo: new Date(AHORA - 40 * 3600 * 1000).toISOString(),
    });
    expect(a).toHaveLength(1);
    expect(a[0].gravedad).toBe("error");
  });

  it("avisa de errores recientes e IPs bloqueadas", () => {
    const a = calcularAlertas({ ...sano, erroresUltimas24h: 2, ipsBloqueadas: 1 });
    expect(a.map((x) => x.gravedad)).toEqual(["aviso", "aviso"]);
  });
});

describe("leerFiltros", () => {
  it("convierte las fechas a día completo en hora de Perú", () => {
    const f = leerFiltros(new URLSearchParams("desde=2026-10-01&hasta=2026-10-01"));
    expect(f.desde?.toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(f.hasta?.toISOString()).toBe("2026-10-02T04:59:59.999Z");
  });

  it("acepta usuario numérico o 'anonimo'", () => {
    expect(leerFiltros(new URLSearchParams("usuario=4")).usuario).toBe(4);
    expect(leerFiltros(new URLSearchParams("usuario=anonimo")).usuario).toBe("anonimo");
  });

  it("rechaza módulos, niveles o usuarios inventados", () => {
    expect(() => leerFiltros(new URLSearchParams("modulo=x"))).toThrow(SistemaValidationError);
    expect(() => leerFiltros(new URLSearchParams("nivel=x"))).toThrow(SistemaValidationError);
    expect(() => leerFiltros(new URLSearchParams("usuario=-1"))).toThrow(SistemaValidationError);
  });

  it("ignora fechas mal escritas", () => {
    expect(leerFiltros(new URLSearchParams("desde=ayer")).desde).toBeNull();
  });
});

describe("celdaCsv", () => {
  it("escapa comillas", () => {
    expect(celdaCsv('dijo "hola"')).toBe('"dijo ""hola"""');
  });

  it("neutraliza fórmulas de Excel", () => {
    expect(celdaCsv("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(celdaCsv("+51 999")).toBe('"\'+51 999"');
  });

  it("vacío para null", () => {
    expect(celdaCsv(null)).toBe('""');
  });
});

describe("calcularAlertas: alertas por correo", () => {
  it("avisa si no están instaladas", () => {
    const a = calcularAlertas({ ...sano, alertasInstaladas: false });
    expect(a).toHaveLength(1);
    expect(a[0].gravedad).toBe("aviso");
  });

  it("error si dejaron de ejecutarse (más de 30 min)", () => {
    const a = calcularAlertas({
      ...sano,
      alertasInstaladas: true,
      alertasUltimaRevision: new Date(AHORA - 45 * 60 * 1000).toISOString(),
    });
    expect(a[0].gravedad).toBe("error");
  });

  it("nada si revisaron hace poco", () => {
    expect(
      calcularAlertas({
        ...sano,
        alertasInstaladas: true,
        alertasUltimaRevision: new Date(AHORA - 5 * 60 * 1000).toISOString(),
      })
    ).toEqual([]);
  });
});

describe("calcularAlertas: casos sin datos", () => {
  it("certificado sin datos ni mensaje de error", () => {
    const a = calcularAlertas({ ...sano, diasCertificado: null, errorCertificado: null });
    expect(a[0].texto).toContain("sin datos");
  });

  it("carpeta de respaldos legible pero vacía → error", () => {
    const a = calcularAlertas({ ...sano, ultimoRespaldo: null });
    expect(a[0]).toMatchObject({ gravedad: "error", texto: "No hay ningún respaldo de la base de datos." });
  });
});

describe("calcularAlertas: memoria", () => {
  // Antes se cubría solo si la PC de pruebas tenía poca RAM libre: ahora es fijo
  it("avisa si queda menos del 10% de memoria libre", () => {
    const a = calcularAlertas({ ...sano, memoriaLibre: 0.5 * GB });
    expect(a).toEqual([{ gravedad: "aviso", texto: "Queda menos del 10% de memoria libre en el servidor." }]);
  });

  it("sin dato de memoria total no avisa", () => {
    expect(calcularAlertas({ ...sano, memoriaTotal: 0, memoriaLibre: 0 })).toEqual([]);
  });
});

describe("calcularAlertas: disco sin datos", () => {
  it("sin espacio libre o sin total no avisa", () => {
    expect(calcularAlertas({ ...sano, discoLibre: null })).toEqual([]);
    expect(calcularAlertas({ ...sano, discoTotal: null })).toEqual([]);
  });
});
