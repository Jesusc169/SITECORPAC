/**
 * Servicios que usan las pantallas para hablar con la API (se ejecutan en el
 * navegador). Se simula fetch: lo que se prueba es qué URL y método usan y
 * cómo convierten las respuestas y los errores.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchFerias as feriasPublicas } from "@/services/eventoFerias.service";
import * as ferias from "@/services/feria.admin.service";
import { fetchSorteos as sorteosPublicos } from "@/services/sorteo.client";
import * as sorteos from "@/services/sorteo.service";

const llamadas: { url: string; init?: RequestInit }[] = [];

function responder(status: number, cuerpo: unknown, comoTexto = false) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    llamadas.push({ url, init });
    return new Response(comoTexto ? String(cuerpo) : JSON.stringify(cuerpo), { status });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  llamadas.length = 0;
});

describe("eventoFerias.service (sitio público)", () => {
  it("con y sin año", async () => {
    responder(200, [{ id: 1 }]);
    expect(await feriasPublicas()).toEqual([{ id: 1 }]);
    await feriasPublicas(2025);
    expect(llamadas.map((l) => l.url)).toEqual(["/api/ferias", "/api/ferias?anio=2025"]);
  });

  it("error → excepción", async () => {
    responder(500, {});
    await expect(feriasPublicas()).rejects.toThrow("Error al obtener ferias");
  });
});

describe("feria.admin.service (panel)", () => {
  it("lecturas", async () => {
    responder(200, { ok: 1 });
    await ferias.fetchFerias();
    await ferias.fetchEmpresasDisponibles();
    await ferias.fetchFeriaPorId(7);
    expect(llamadas.map((l) => l.url)).toEqual(["/api/administrador/ferias", "/api/administrador/empresas", "/api/administrador/ferias/7"]);
  });

  it.each([
    ["fetchFerias", () => ferias.fetchFerias(), "Error al cargar ferias"],
    ["fetchEmpresasDisponibles", () => ferias.fetchEmpresasDisponibles(), "Error al cargar empresas"],
    ["fetchFeriaPorId", () => ferias.fetchFeriaPorId(1), "Error al obtener feria"],
  ])("%s: error", async (_n, fn, msg) => {
    responder(500, {});
    await expect(fn()).rejects.toThrow(msg);
  });

  it("guardar: POST al crear, PUT al editar; muestra el motivo real del error", async () => {
    responder(201, { id: 1 });
    await ferias.guardarFeria(false, undefined, new FormData());
    await ferias.guardarFeria(true, 9, new FormData());
    expect(llamadas.map((l) => [l.init?.method, l.url])).toEqual([["POST", "/api/administrador/ferias"], ["PUT", "/api/administrador/ferias/9"]]);
    responder(400, { error: "Cada imagen debe ser menor a 10MB" });
    await expect(ferias.guardarFeria(false, undefined, new FormData())).rejects.toThrow("10MB");
    responder(500, "no es json", true);
    await expect(ferias.guardarFeria(false, undefined, new FormData())).rejects.toThrow("Error al guardar feria");
  });

  it("duplicar devuelve el texto; error con el texto de la API", async () => {
    responder(200, "ok", true);
    expect(await ferias.duplicarFeria(3)).toBe("ok");
    responder(404, "Feria no encontrada", true);
    await expect(ferias.duplicarFeria(3)).rejects.toThrow("Feria no encontrada");
  });

  it("eliminar: ok, error con motivo y sin motivo", async () => {
    responder(200, {});
    await expect(ferias.eliminarFeria(1)).resolves.toBeUndefined();
    responder(500, { error: "No autorizado" });
    await expect(ferias.eliminarFeria(1)).rejects.toThrow("No autorizado");
    responder(500, "x", true);
    await expect(ferias.eliminarFeria(1)).rejects.toThrow("Error al eliminar feria");
  });
});

describe("sorteo.client (sitio público)", () => {
  it("con y sin año; si falla devuelve lista vacía", async () => {
    responder(200, [{ id: 1 }]);
    await sorteosPublicos(null);
    await sorteosPublicos(2026);
    expect(llamadas.map((l) => l.url)).toEqual(["/api/sorteos", "/api/sorteos?anio=2026"]);
    responder(500, {});
    expect(await sorteosPublicos(null)).toEqual([]);
  });
});

describe("sorteo.service (panel)", () => {
  it("listar", async () => {
    responder(200, [{ id: 1 }]);
    expect(await sorteos.fetchSorteos()).toEqual([{ id: 1 }]);
  });

  it("eliminar y duplicar: ok y errores con o sin motivo", async () => {
    responder(200, { id: 2 });
    await sorteos.eliminarSorteo(1);
    expect(await sorteos.duplicarSorteo(1)).toEqual({ id: 2 });
    responder(400, { error: "ID inválido" });
    await expect(sorteos.eliminarSorteo(1)).rejects.toThrow("ID inválido");
    await expect(sorteos.duplicarSorteo(1)).rejects.toThrow("ID inválido");
    responder(500, "x", true);
    await expect(sorteos.eliminarSorteo(1)).rejects.toThrow("Error al eliminar sorteo");
    await expect(sorteos.duplicarSorteo(1)).rejects.toThrow("Error al duplicar sorteo");
  });
});
