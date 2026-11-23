import { describe, it, expect, vi } from "vitest";
import { mensajeDe, avisoDe, leerJson, errorDe, jsonOError, ERROR_CONEXION } from "@/lib/mensajes";

const POR_DEFECTO = "No se pudo";

describe("mensajeDe", () => {
  it("usa el mensaje de un Error propio", () => {
    expect(mensajeDe(new Error("Cada imagen debe ser menor a 10MB"), POR_DEFECTO)).toBe("Cada imagen debe ser menor a 10MB");
  });

  it("oculta errores técnicos del navegador y casos raros", () => {
    expect(mensajeDe(new TypeError("Cannot read properties of undefined"), POR_DEFECTO)).toBe(POR_DEFECTO);
    expect(mensajeDe(new SyntaxError("Unexpected token <"), POR_DEFECTO)).toBe(POR_DEFECTO);
    expect(mensajeDe(new Error(""), POR_DEFECTO)).toBe(POR_DEFECTO);
    expect(mensajeDe("falla rara", POR_DEFECTO)).toBe(POR_DEFECTO);
    expect(mensajeDe(null, POR_DEFECTO)).toBe(POR_DEFECTO);
  });
});

describe("mensajeDe sin red", () => {
  it("pide revisar internet en Chrome, Safari y Firefox", () => {
    for (const m of ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."]) {
      expect(mensajeDe(new TypeError(m), POR_DEFECTO)).toBe(ERROR_CONEXION);
    }
  });
});

describe("avisoDe", () => {
  it("deja el detalle en la consola y devuelve el texto claro", () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    const e = new SyntaxError("Unexpected token <");
    expect(avisoDe("Papelera", e, POR_DEFECTO)).toBe(POR_DEFECTO);
    expect(consola).toHaveBeenCalledWith("Papelera:", e);
    consola.mockRestore();
  });
});

describe("leerJson", () => {
  it("devuelve el JSON o null si no lo es", async () => {
    expect(await leerJson(new Response('{"a":1}'))).toEqual({ a: 1 });
    expect(await leerJson(new Response("<html>Bad Gateway</html>"))).toBeNull();
    expect(await leerJson(new Response(""))).toBeNull();
  });
});

describe("errorDe", () => {
  it("solo acepta un texto no vacío en error", () => {
    expect(errorDe({ error: "x" })).toBe("x");
    expect(errorDe({ error: "" })).toBeUndefined();
    expect(errorDe({ error: 1 })).toBeUndefined();
    expect(errorDe(null)).toBeUndefined();
    expect(errorDe([])).toBeUndefined();
    expect(errorDe("texto")).toBeUndefined();
  });
});

describe("jsonOError", () => {
  it("200 con JSON → los datos", async () => {
    expect(await jsonOError(new Response("[1,2]"), POR_DEFECTO)).toEqual([1, 2]);
  });

  it("error con {error} → ese mensaje", async () => {
    await expect(jsonOError(new Response('{"error":"Sin permiso"}', { status: 403 }), POR_DEFECTO)).rejects.toThrow("Sin permiso");
  });

  it("HTML (con error o con 200) → texto por defecto", async () => {
    await expect(jsonOError(new Response("<html>", { status: 502 }), POR_DEFECTO)).rejects.toThrow(POR_DEFECTO);
    await expect(jsonOError(new Response("<html>"), POR_DEFECTO)).rejects.toThrow(POR_DEFECTO);
  });
});
