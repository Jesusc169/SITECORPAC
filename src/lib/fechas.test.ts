import { describe, it, expect } from "vitest";
import { fechaHoraPeru, partesPeru, formatearFechaSola, formatearFechaHoraPeru } from "./fechas";

describe("fechas en hora de Perú", () => {
  it("la hora escrita en el panel se guarda como hora de Perú (UTC−5)", () => {
    const iso = new Date(fechaHoraPeru("2026-03-30", "19:00")).toISOString();
    expect(iso).toBe("2026-03-31T00:00:00.000Z");
  });

  it("al editar, el formulario recupera la misma fecha y hora (no se corre)", () => {
    const guardado = new Date(fechaHoraPeru("2026-12-24", "20:30"));
    expect(partesPeru(guardado)).toEqual({ fecha: "2026-12-24", hora: "20:30" });
    // Guardar otra vez lo recuperado da el mismo instante.
    const p = partesPeru(guardado);
    expect(new Date(fechaHoraPeru(p.fecha, p.hora)).getTime()).toBe(guardado.getTime());
  });

  it("una fecha de feria (medianoche UTC) no se muestra un día antes", () => {
    expect(formatearFechaSola("2026-03-30T00:00:00.000Z", { day: "2-digit", month: "long", year: "numeric" }))
      .toBe("30 de marzo de 2026");
  });

  it("la hora de un sorteo se muestra en hora de Perú", () => {
    const texto = formatearFechaHoraPeru("2026-03-31T00:00:00.000Z", { hour: "2-digit", minute: "2-digit", hour12: false });
    expect(texto).toContain("19:00");
  });
});

describe("partesPeru con una fecha inválida", () => {
  it("devuelve campos vacíos", async () => {
    const { partesPeru } = await import("./fechas");
    expect(partesPeru("no es fecha")).toEqual({ fecha: "", hora: "" });
  });
});

describe("textos de fecha del sitio público (rediseño A+C)", () => {
  it("fechaCorta usa la fecha de Perú y meses abreviados", async () => {
    const { fechaCorta } = await import("./fechas");
    // 03:00 UTC del 15 = 22:00 del 14 en Perú
    expect(fechaCorta("2026-09-15T03:00:00.000Z")).toBe("14 sep 2026");
    expect(fechaCorta("2026-01-02T15:00:00.000Z")).toBe("2 ene 2026");
    expect(fechaCorta("no es fecha")).toBe("");
  });

  it("diaConSemana no se corre un día (fecha guardada a medianoche UTC)", async () => {
    const { diaConSemana } = await import("./fechas");
    expect(diaConSemana("2026-03-30T00:00:00.000Z")).toBe("Lun 30 de marzo");
  });

  it("rangoDias arma la frase de los días de la feria", async () => {
    const { rangoDias } = await import("./fechas");
    expect(rangoDias([])).toBe("");
    expect(rangoDias(["2026-03-02T00:00:00.000Z"])).toBe("2 de marzo");
    expect(rangoDias(["2026-03-31T00:00:00.000Z", "2026-03-30T00:00:00.000Z"])).toBe("30 y 31 de marzo");
    expect(rangoDias(["2026-03-02", "2026-03-03", "2026-03-04"])).toBe("2, 3 y 4 de marzo");
    expect(rangoDias(["2026-04-01", "2026-03-31"])).toBe("31 de marzo y 1 de abril");
    expect(rangoDias(["2026-12-31", "2027-01-01", "2026-12-30"])).toBe("30 de diciembre, 31 de diciembre y 1 de enero");
  });

  it("feriaFinalizada compara con el día de hoy en Perú", async () => {
    const { feriaFinalizada } = await import("./fechas");
    const hoy = new Date("2026-03-31T20:00:00.000Z"); // 31 de marzo en Perú
    expect(feriaFinalizada([], hoy)).toBe(false);
    expect(feriaFinalizada(["2026-03-30", "2026-03-31"], hoy)).toBe(false);
    expect(feriaFinalizada(["2026-03-02", "2026-03-30"], hoy)).toBe(true);
    expect(feriaFinalizada(["2027-03-02"])).toBe(false);
  });
});
