/**
 * Casos en que la base de datos falla y el código debe seguir respondiendo.
 * Va en un archivo aparte porque espía métodos del cliente de Prisma y NO los
 * restaura (restaurarlos deja el cliente roto para los tests siguientes).
 */
import { describe, it, expect, vi } from "vitest";
import prisma from "@/lib/prisma";
import { getBeneficioFallecidoData } from "@/models/beneficiosFallecidoModel";
import { obtenerBeneficioFallecido } from "@/controllers/beneficioFallecidoController";

describe("si la base de datos falla", () => {
  it("la página de beneficio por fallecimiento se muestra vacía en vez de romperse", async () => {
    vi.spyOn(prisma.beneficio_fallecido, "findFirst").mockRejectedValueOnce(new Error("bd caída"));
    expect(await getBeneficioFallecidoData()).toBeNull();
    vi.spyOn(prisma.beneficio_fallecido, "findFirst").mockRejectedValueOnce(new Error("bd caída"));
    expect((await obtenerBeneficioFallecido()).titulo).toBe("");
  });
});
