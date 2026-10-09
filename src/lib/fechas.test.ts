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
