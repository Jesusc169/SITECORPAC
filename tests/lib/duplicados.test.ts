import { beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { hayDuplicadoReciente, mensajeDuplicado, VENTANA_DUPLICADO_SEG } from "@/lib/duplicados";
import { limpiarBD } from "../helpers";

beforeEach(limpiarBD);

const haceUnRato = () => new Date(Date.now() - (VENTANA_DUPLICADO_SEG + 60) * 1000);

describe("hayDuplicadoReciente", () => {
  it("detecta una feria con el mismo título recién creada", async () => {
    await prisma.evento_feria.create({ data: { titulo: "Feria Colinda", descripcion: "x", anio: 2026 } });
    expect(await hayDuplicadoReciente("feria", "  Feria Colinda ")).toBe(true);
    expect(await hayDuplicadoReciente("feria", "Otra feria")).toBe(false);
  });

  it("no cuenta una feria igual creada hace más de 2 minutos", async () => {
    await prisma.evento_feria.create({
      data: { titulo: "Feria Colinda", descripcion: "x", anio: 2026, created_at: haceUnRato() },
    });
    expect(await hayDuplicadoReciente("feria", "Feria Colinda")).toBe(false);
  });

  it("detecta noticias y sorteos repetidos", async () => {
    await prisma.noticia.create({ data: { titulo: "Aviso", descripcion: "d", autor: "a", updatedAt: new Date() } });
    await prisma.sorteo.create({
      data: { nombre: "Sorteo navideño", descripcion: "d", lugar: "Sede", anio: 2026, fecha_hora: new Date() },
    });
    expect(await hayDuplicadoReciente("noticia", "Aviso")).toBe(true);
    expect(await hayDuplicadoReciente("sorteo", "Sorteo navideño")).toBe(true);
    expect(await hayDuplicadoReciente("sorteo", "Aviso")).toBe(false);
  });

  it("explica qué pasó en palabras simples", () => {
    expect(mensajeDuplicado("feria")).toMatch(/^Ya se guardó una feria con este mismo título/);
    expect(mensajeDuplicado("noticia")).toContain("una noticia");
    expect(mensajeDuplicado("sorteo")).toContain("un sorteo");
  });
});
