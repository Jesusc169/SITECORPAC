import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { EventEmitter } from "events";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, utimesSync } from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";

// Socket TLS de mentira: cada test decide qué pasa al conectar
const tlsMock = vi.hoisted(() => ({ comportamiento: "ok" as "ok" | "sinCert" | "timeout" | "error", cert: {} as Record<string, unknown> }));
vi.mock("tls", () => ({
  default: {
    connect: (_o: unknown, alConectar: () => void) => {
      const s = Object.assign(new EventEmitter(), {
        getPeerCertificate: () => tlsMock.cert,
        end: () => {},
        destroy: () => {},
      });
      setTimeout(() => {
        if (tlsMock.comportamiento === "timeout") s.emit("timeout");
        else if (tlsMock.comportamiento === "error") s.emit("error", new Error("ECONNREFUSED"));
        else alConectar();
      }, 0);
      return s;
    },
  },
}));

import {
  leerVersion, estadoMaquina, archivosSubidos, estadoRespaldos, estadoCertificado, estadoAlertas,
} from "@/lib/estadoServidor";

const raiz = () => process.cwd();
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.BACKUPS_DIR;
  delete process.env.ALERTAS_ESTADO;
  delete process.env.NEXT_PUBLIC_BASE_URL;
  rmSync(path.join(raiz(), ".git"), { recursive: true, force: true });
  rmSync(path.join(raiz(), ".next"), { recursive: true, force: true });
});

describe("leerVersion", () => {
  it("sin .git ni .next → null", async () => {
    expect(await leerVersion()).toEqual({ commit: null, compilado: null });
  });

  it("rama con su archivo de referencia + hora de compilación", async () => {
    mkdirSync(path.join(raiz(), ".git", "refs", "heads"), { recursive: true });
    writeFileSync(path.join(raiz(), ".git", "HEAD"), "ref: refs/heads/main\n");
    writeFileSync(path.join(raiz(), ".git", "refs", "heads", "main"), "abcdef1234567890\n");
    mkdirSync(path.join(raiz(), ".next"));
    writeFileSync(path.join(raiz(), ".next", "BUILD_ID"), "x");
    const v = await leerVersion();
    expect(v.commit).toBe("abcdef1");
    expect(v.compilado).toMatch(/^\d{4}-/);
  });

  it("referencia empaquetada (packed-refs)", async () => {
    mkdirSync(path.join(raiz(), ".git"), { recursive: true });
    writeFileSync(path.join(raiz(), ".git", "HEAD"), "ref: refs/heads/main\n");
    writeFileSync(path.join(raiz(), ".git", "packed-refs"), "# pack\n1234567aaaa refs/heads/otra\n9876543bbbb refs/heads/main\n");
    expect((await leerVersion()).commit).toBe("9876543");
  });

  it("rama que no aparece en packed-refs → null", async () => {
    mkdirSync(path.join(raiz(), ".git"), { recursive: true });
    writeFileSync(path.join(raiz(), ".git", "HEAD"), "ref: refs/heads/main\n");
    writeFileSync(path.join(raiz(), ".git", "packed-refs"), "1234567 refs/heads/otra\n");
    expect((await leerVersion()).commit).toBeNull();
  });

  it("HEAD suelto (commit directo)", async () => {
    mkdirSync(path.join(raiz(), ".git"), { recursive: true });
    writeFileSync(path.join(raiz(), ".git", "HEAD"), "fedcba9876543\n");
    expect((await leerVersion()).commit).toBe("fedcba9");
  });
});

describe("estadoMaquina", () => {
  it("lee el nombre del sistema de /etc/os-release cuando existe", async () => {
    const real = fsp.readFile;
    vi.spyOn(fsp, "readFile").mockImplementation(((p: string, ...r: unknown[]) =>
      p === "/etc/os-release" ? Promise.resolve('NAME="Ubuntu"\nPRETTY_NAME="Ubuntu 24.04.5 LTS"\n') : (real as never as (...a: unknown[]) => Promise<string>)(p, ...r)) as never);
    const m = await estadoMaquina();
    expect(m.sistema).toBe("Ubuntu 24.04.5 LTS");
    expect(m.node).toBe(process.version);
    expect(m.discoTotal).toBeGreaterThan(0);
  });

  it("os-release sin PRETTY_NAME o inexistente → tipo y versión del SO", async () => {
    vi.spyOn(fsp, "readFile").mockResolvedValueOnce("NAME=x\n" as never);
    expect((await estadoMaquina()).sistema).toBe(`${os.type()} ${os.release()}`);
    vi.spyOn(fsp, "readFile").mockRejectedValueOnce(new Error("no existe"));
    expect((await estadoMaquina()).sistema).toBe(`${os.type()} ${os.release()}`);
  });

  it("si no se puede medir el disco devuelve null", async () => {
    vi.spyOn(fsp, "statfs").mockRejectedValueOnce(new Error("x"));
    const m = await estadoMaquina();
    expect(m.discoTotal).toBeNull();
    expect(m.instancia).toBeNull();
  });

  it("informa la instancia de PM2", async () => {
    process.env.NODE_APP_INSTANCE = "1";
    expect((await estadoMaquina()).instancia).toBe("1");
    delete process.env.NODE_APP_INSTANCE;
  });
});

describe("archivosSubidos", () => {
  it("cuenta archivos en uploads y en images/uploads (subcarpetas incluidas)", async () => {
    const d = path.join(raiz(), "public", "uploads", "medir", "sub");
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, "a.txt"), "12345");
    const antes = await archivosSubidos();
    mkdirSync(path.join(raiz(), "public", "images", "uploads"), { recursive: true });
    writeFileSync(path.join(raiz(), "public", "images", "uploads", "b.txt"), "123");
    const despues = await archivosSubidos();
    expect(despues.archivos).toBe(antes.archivos + 1);
    expect(despues.bytes).toBe(antes.bytes + 3);
    rmSync(path.join(raiz(), "public", "uploads", "medir"), { recursive: true });
  });

  it("si un archivo desaparece mientras se mide, sigue contando", async () => {
    writeFileSync(path.join(raiz(), "public", "uploads", "fugaz.txt"), "x");
    vi.spyOn(fsp, "stat").mockRejectedValue(new Error("ENOENT"));
    const r = await archivosSubidos();
    expect(r.archivos).toBeGreaterThan(0);
    expect(r.bytes).toBe(0);
    rmSync(path.join(raiz(), "public", "uploads", "fugaz.txt"));
  });
});

describe("estadoRespaldos", () => {
  it("lee la carpeta de respaldos: cantidad, tamaño y el más reciente", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "resp-"));
    writeFileSync(path.join(dir, "sitecorpac_1.sql.gz"), "aa");
    writeFileSync(path.join(dir, "sitecorpac_2.sql.gz"), "bbbb");
    writeFileSync(path.join(dir, "backup.log"), "no cuenta");
    utimesSync(path.join(dir, "sitecorpac_1.sql.gz"), new Date("2026-01-01"), new Date("2026-01-01"));
    process.env.BACKUPS_DIR = dir;
    const r = await estadoRespaldos();
    expect(r).toMatchObject({ disponible: true, cantidad: 2, bytesTotal: 6 });
    expect(r.ultimo?.nombre).toBe("sitecorpac_2.sql.gz");
  });

  it("carpeta vacía → sin último respaldo; carpeta inexistente → no disponible", async () => {
    process.env.BACKUPS_DIR = mkdtempSync(path.join(os.tmpdir(), "resp-"));
    expect((await estadoRespaldos()).ultimo).toBeNull();
    process.env.BACKUPS_DIR = path.join(os.tmpdir(), "no-existe-xyz");
    expect((await estadoRespaldos()).disponible).toBe(false);
  });

  it("por defecto mira /home/sitecorpac/backups", async () => {
    expect((await estadoRespaldos()).carpeta).toBe("/home/sitecorpac/backups");
  });
});

describe("estadoCertificado", () => {
  beforeEach(() => {
    tlsMock.comportamiento = "ok";
    tlsMock.cert = { valid_to: new Date(Date.now() + 40 * 86400000).toUTCString(), issuer: { O: "Let's Encrypt" } };
  });

  it("días que faltan y emisor (dominio de NEXT_PUBLIC_BASE_URL)", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.sitecorpac.com";
    const c = await estadoCertificado();
    expect(c).toMatchObject({ dominio: "www.sitecorpac.com", emisor: "Let's Encrypt", error: null });
    expect(c.diasRestantes).toBeGreaterThanOrEqual(39);
  });

  it("URL http, mal escrita o ausente → sitecorpac.com", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    expect((await estadoCertificado()).dominio).toBe("sitecorpac.com");
    process.env.NEXT_PUBLIC_BASE_URL = "https://";
    expect((await estadoCertificado()).dominio).toBe("sitecorpac.com");
  });

  it("certificado sin emisor", async () => {
    tlsMock.cert = { valid_to: new Date(Date.now() + 86400000).toUTCString() };
    expect((await estadoCertificado()).emisor).toBeNull();
  });

  it.each([
    ["sin certificado", "sinCert", "Sin certificado"],
    ["sin respuesta", "timeout", "Sin respuesta"],
    ["error de red", "error", "ECONNREFUSED"],
  ] as const)("%s", async (_n, comp, error) => {
    tlsMock.comportamiento = comp === "sinCert" ? "ok" : comp;
    if (comp === "sinCert") tlsMock.cert = {};
    const c = await estadoCertificado();
    expect(c).toMatchObject({ venceEl: null, diasRestantes: null, error });
  });
});

describe("estadoAlertas", () => {
  const archivoEstado = (contenido: string) => {
    const f = path.join(mkdtempSync(path.join(os.tmpdir(), "al-")), "estado.json");
    writeFileSync(f, contenido);
    process.env.ALERTAS_ESTADO = f;
  };

  it("lee lo que dejó el script de alertas", async () => {
    archivoEstado(JSON.stringify({ ultimaRevision: "2026-10-09T01:00:00Z", destinatario: "a@b.c", resumenDiario: true, ultimoCorreo: { fecha: "2026-10-09T01:00:00Z", asunto: "⚠️ x" } }));
    expect(await estadoAlertas()).toEqual({ instaladas: true, ultimaRevision: "2026-10-09T01:00:00Z", destinatario: "a@b.c", resumenDiario: true, ultimoCorreo: { fecha: "2026-10-09T01:00:00Z", asunto: "⚠️ x" } });
  });

  it("campos faltantes o con tipos raros", async () => {
    archivoEstado(JSON.stringify({ resumenDiario: false, ultimoCorreo: { fecha: "2026-10-09" } }));
    expect(await estadoAlertas()).toEqual({ instaladas: true, ultimaRevision: null, destinatario: null, resumenDiario: false, ultimoCorreo: { fecha: "2026-10-09", asunto: "" } });
    archivoEstado(JSON.stringify({ ultimoCorreo: { fecha: 5 } }));
    expect((await estadoAlertas()).ultimoCorreo).toBeNull();
  });

  it("sin archivo (o ruta por defecto en Windows) → no instaladas", async () => {
    expect((await estadoAlertas()).instaladas).toBe(false);
  });
});
