import { afterEach, describe, expect, it, vi } from "vitest";
import { enviarConLimite, LIMITE_GUARDADO_MS, MENSAJE_TIEMPO_AGOTADO } from "./enviarConLimite";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// fetch falso que nunca responde, salvo que se cancele con la señal.
function fetchColgado() {
  return vi.fn((_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError"))
      );
    })
  );
}

describe("enviarConLimite", () => {
  it("el límite por defecto es 30 segundos", () => {
    expect(LIMITE_GUARDADO_MS).toBe(30_000);
  });

  it("si el servidor no responde, corta a los 30 s con un mensaje claro", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchColgado());

    const promesa = enviarConLimite("/api/x", { method: "POST" });
    const verificacion = expect(promesa).rejects.toThrow(MENSAJE_TIEMPO_AGOTADO);
    await vi.advanceTimersByTimeAsync(LIMITE_GUARDADO_MS);
    await verificacion;
  });

  it("devuelve la respuesta normal si llega a tiempo", async () => {
    const respuesta = new Response("{}", { status: 201 });
    vi.stubGlobal("fetch", vi.fn(async () => respuesta));
    await expect(enviarConLimite("/api/x", { method: "POST" })).resolves.toBe(respuesta);
  });

  it("un corte de red da un mensaje entendible", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(enviarConLimite("/api/x", { method: "POST" })).rejects.toThrow(/Revisa tu internet/);
  });
});
