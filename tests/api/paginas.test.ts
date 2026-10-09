import { describe, it, expect, beforeEach, vi } from "vitest";
import { obtenerBeneficioFallecido } from "@/controllers/beneficioFallecidoController";
import { ConstitucionController } from "@/controllers/constitucionController";
import { EstatutoController } from "@/controllers/estatutoController";
import { LeyRelacionesController } from "@/controllers/leyRelacionesController";
import { LeySeguridadController } from "@/controllers/leySeguridadController";
import { OitController } from "@/controllers/oitController";
import { PrestamosController } from "@/controllers/prestamosController";
import { NuestraHistoriaController } from "@/controllers/NuestraHistoriaController";
import { getWhatsAppLink } from "@/controllers/contact.controller";
import { DashboardController } from "@/controllers/dashboardController";
import { INSTITUCION, FECHA_POLITICAS } from "@/lib/datosInstitucionales";
import { limpiarBD, prisma } from "../helpers";

beforeEach(limpiarBD);

describe("Trámite: beneficio por fallecimiento", () => {
  it("sin datos cargados devuelve todo vacío", async () => {
    expect(await obtenerBeneficioFallecido()).toEqual({ titulo: "", descripcion: "", imagenHero: "", requisitos: [], faqs: [] });
  });

  it("requisitos y preguntas ordenados; sin imagen → texto vacío", async () => {
    await prisma.beneficio_fallecido.create({
      data: {
        titulo: "Beneficio", descripcion: "Hasta 5000 soles",
        beneficio_fallecido_requisitos: { create: [{ descripcion: "DNI", orden: 2 }, { descripcion: "Afiliado", orden: 1 }] },
        beneficio_fallecido_faq: { create: [{ pregunta: "¿Monto?", respuesta: "5000", orden: 1 }] },
      },
    });
    const d = await obtenerBeneficioFallecido();
    expect(d.titulo).toBe("Beneficio");
    expect(d.imagenHero).toBe("");
    expect(d.requisitos.map((r) => r.descripcion)).toEqual(["Afiliado", "DNI"]);
    expect(d.faqs).toHaveLength(1);
  });

  it("con imagen", async () => {
    await prisma.beneficio_fallecido.create({ data: { titulo: "B", descripcion: "d", imagen_hero: "/img.jpg" } });
    expect((await obtenerBeneficioFallecido()).imagenHero).toBe("/img.jpg");
  });
});

describe("Legislación: solo contenido activo y en orden", () => {
  it("Constitución, Ley de Seguridad y OIT", async () => {
    for (const tabla of ["constitucion_contenido", "ley_seguridad_contenido", "oit_contenido"] as const) {
      const t = prisma[tabla] as unknown as { createMany: (a: unknown) => Promise<unknown> };
      await t.createMany({ data: [{ titulo: "B", descripcion: "d", orden: 2 }, { titulo: "A", descripcion: "d", orden: 1 }, { titulo: "Oculto", descripcion: "d", estado: 0 }] });
    }
    for (const c of [ConstitucionController, LeySeguridadController, OitController]) {
      expect((await c.getData()).contenidos.map((x) => x.titulo)).toEqual(["A", "B"]);
    }
  });

  it("Estatuto y Ley de Relaciones Colectivas (el activo)", async () => {
    await prisma.estatuto_contenido.create({ data: { titulo: "Viejo", descripcion: "d", enlace_pdf: "/a.pdf", estado: 0 } });
    await prisma.estatuto_contenido.create({ data: { titulo: "Estatuto", descripcion: "d", enlace_pdf: "/b.pdf" } });
    await prisma.ley_relaciones_colectivas.create({ data: { titulo: "Ley", descripcion: "d", enlace_pdf: "/c.pdf" } });
    expect((await EstatutoController.getData()).estatuto?.titulo).toBe("Estatuto");
    expect((await LeyRelacionesController.getData()).ley?.titulo).toBe("Ley");
  });
});

describe("Trámite: préstamos", () => {
  it("cooperativas, requisitos y preguntas activos", async () => {
    await prisma.cooperativas.createMany({ data: [{ nombre: "San Isidro" }, { nombre: "Cerrada", estado: 0 }] });
    await prisma.prestamo_requisitos.create({ data: { descripcion: "Estar afiliado" } });
    await prisma.prestamo_faq.create({ data: { pregunta: "¿Rol?", respuesta: "Nexo" } });
    const d = await PrestamosController.getData();
    expect(d.cooperativas.map((c) => c.nombre)).toEqual(["San Isidro"]);
    expect(d.requisitos).toHaveLength(1);
    expect(d.faqs).toHaveLength(1);
  });
});

describe("Contenido fijo del sitio", () => {
  it("historia, WhatsApp y datos legales", () => {
    const h = NuestraHistoriaController.getData();
    expect(h.titulo).toBe("Nuestra Historia");
    expect(h.eventos.length).toBeGreaterThan(0);
    expect(getWhatsAppLink()).toBe("https://wa.me/+51950215616?text=Hola%2C%20quisiera%20comunicarme%20con%20el%20SITE");
    expect(INSTITUCION.ruc).toBe("20601511836");
    expect(FECHA_POLITICAS).toMatch(/2026/);
  });
});

describe("Inicio del panel (dashboard)", () => {
  it("cuenta noticias visibles, ferias y sorteos activos, estatutos y últimos títulos", async () => {
    const ahora = new Date();
    await prisma.noticia.createMany({ data: [
      { titulo: "Vieja", descripcion: "d", autor: "A", updatedAt: ahora, fecha: new Date("2025-01-01") },
      { titulo: "Nueva", descripcion: "d", autor: "A", updatedAt: ahora, fecha: new Date("2026-01-01") },
      { titulo: "Oculta", descripcion: "d", autor: "A", updatedAt: ahora, activo: false },
    ] });
    await prisma.evento_feria.createMany({ data: [{ titulo: "F", descripcion: "d", anio: 2026 }, { titulo: "F2", descripcion: "d", anio: 2026, estado: false }] });
    await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: ahora, anio: 2026 } });
    await prisma.estatuto_contenido.create({ data: { titulo: "E", descripcion: "d", enlace_pdf: "/e.pdf" } });
    const r = await DashboardController.obtenerResumen();
    expect(r).toMatchObject({ totalNoticias: 2, totalEventos: 1, totalSorteos: 1, totalDocumentos: 1 });
    // "Últimas actualizaciones" es interna del panel: también lista las ocultas
    expect(r.ultimasNoticias.map((n) => n.titulo)).toEqual(["Oculta", "Nueva", "Vieja"]);
  });
});

describe("sitemap.xml y robots.txt", () => {
  it("sitemap: rutas públicas + una por noticia visible", async () => {
    await prisma.noticia.create({ data: { id: 50, titulo: "N", descripcion: "d", autor: "A", updatedAt: new Date() } });
    await prisma.noticia.create({ data: { id: 51, titulo: "Oculta", descripcion: "d", autor: "A", updatedAt: new Date(), activo: false } });
    vi.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.sitecorpac.com";
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://www.sitecorpac.com/privacidad");
    expect(urls).toContain("https://www.sitecorpac.com/actividades/noticias/50");
    expect(urls).not.toContain("https://www.sitecorpac.com/actividades/noticias/51");
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it("sin URL configurada (o sin http) usa https://sitecorpac.com", async () => {
    for (const valor of [undefined, "sitecorpac.com"]) {
      vi.resetModules();
      if (valor) process.env.NEXT_PUBLIC_BASE_URL = valor;
      const { default: robots } = await import("@/app/robots");
      const { default: sitemap } = await import("@/app/sitemap");
      expect(robots()).toMatchObject({ sitemap: "https://sitecorpac.com/sitemap.xml", rules: { disallow: ["/admin", "/dashboard", "/login", "/api"] } });
      expect((await sitemap())[0].url).toBe("https://sitecorpac.com");
      delete process.env.NEXT_PUBLIC_BASE_URL;
    }
  });

  it("robots con URL configurada", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = "https://x.pe";
    const { default: robots } = await import("@/app/robots");
    expect(robots().sitemap).toBe("https://x.pe/sitemap.xml");
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });
});
