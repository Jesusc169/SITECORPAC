import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile, utimes, readdir, rm } from "fs/promises";
import { NextRequest } from "next/server";
import { GET as espacioGET, POST as subir } from "@/app/api/administrador/videos/route";
import { GET as estadoGET } from "@/app/api/administrador/videos/[id]/route";
import { POST as interno } from "@/app/api/interno/videos/route";
import { POST as crearNoticia } from "@/app/api/administrador/noticias/route";
import { PUT as editarNoticia } from "@/app/api/administrador/noticias/[id]/route";
import { POST as crearFeria } from "@/app/api/administrador/ferias/route";
import { PUT as editarFeria } from "@/app/api/administrador/ferias/[id]/route";
import { POST as crearSorteo } from "@/app/api/administrador/sorteos/route";
import { PUT as editarSorteo } from "@/app/api/administrador/sorteos/[id]/route";
import { NoticiasController } from "@/controllers/noticiasController";
import { FeriaController } from "@/controllers/feriaController";
import { SorteoController } from "@/controllers/sorteoController";
import { moverAPapelera, restaurarDePapelera } from "@/lib/papelera";
import {
  carpetaOriginales, carpetaPublica, rutaDeUrl, rutaOriginal, espacioVideos, verificarEspacio, textoTamano,
  libreEnDisco, cuotaBytes, libreMinimoBytes, VideoError,
} from "@/lib/videos/almacen";
import { pareceVideo, extensionValida, nombreDeCabecera } from "@/lib/videos/subida";
import {
  recuperarAbandonados, reclamarSiguiente, comprimir, procesarCola, avisarAlSitio, claveInterna, iniciarProcesador, vueltaDelProcesador,
  MENSAJES, MAX_INTENTOS,
} from "@/lib/videos/procesador";
import { limpiarVideos, videosEnUso } from "@/lib/videos/limpieza";
import { cambioVideoDeFormulario, validarCambioVideo, videoPublico } from "@/lib/videos/vincular";
import { puedeUsarVideos } from "@/lib/permisos";
import type { Ejecutor } from "@/lib/videos/ffmpeg";
import { etiquetasInvalidadas } from "../setup";
import { limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, cerrarSesion, peticion, params, prisma } from "../helpers";

const GB = 1024 ** 3;
// Cabecera de un MP4 de verdad: tamaño de caja + "ftyp" + marca
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(200, 1)]);

function peticionVideo(cuerpo: Buffer | null, cabeceras: Record<string, string> = {}) {
  const headers: Record<string, string> = { "x-real-ip": "10.0.0.1", "x-nombre-archivo": "sorteo.mp4", ...cabeceras };
  if (cuerpo && !("content-length" in cabeceras)) headers["content-length"] = String(cuerpo.length);
  return new Request("http://localhost/api/administrador/videos", {
    method: "POST",
    headers,
    body: cuerpo ? new Uint8Array(cuerpo) : undefined,
  });
}

async function videoEnBD(datos: Partial<Parameters<typeof prisma.video.create>[0]["data"]> = {}) {
  return prisma.video.create({ data: { nombre_original: "v.mp4", bytes_original: 1000, ...datos } });
}

/** Simula ffprobe + ffmpeg: escribe los archivos que ffmpeg dejaría. */
function ejecutorFalso(opciones: { sonda?: object | null; codigoSonda?: number; compresion?: number[]; portada?: number; enoent?: "sonda" | "ffmpeg" } = {}): Ejecutor & { llamadas: string[][] } {
  const compresiones = [...(opciones.compresion ?? [0])];
  const llamadas: string[][] = [];
  const f = (async (_programa, args, extra) => {
    llamadas.push(args);
    if (args.includes("-show_streams")) {
      if (opciones.enoent === "sonda") return { codigo: null, salida: "", errores: "spawn ffprobe ENOENT" };
      const s = opciones.sonda === undefined ? { streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }], format: { duration: "60" } } : opciones.sonda;
      return { codigo: opciones.codigoSonda ?? 0, salida: JSON.stringify(s), errores: "" };
    }
    const salida = args.at(-1)!;
    if (args.includes("-frames:v")) {
      if ((opciones.portada ?? 0) === 0) await writeFile(salida, "jpg");
      return { codigo: opciones.portada ?? 0, salida: "", errores: "" };
    }
    if (opciones.enoent === "ffmpeg") return { codigo: null, salida: "", errores: "spawn ffmpeg ENOENT" };
    extra?.alLeerLinea?.("out_time_us=30000000");
    extra?.alLeerLinea?.("out_time_us=45000000"); // dentro de los 3 s: no se guarda
    extra?.alLeerLinea?.("frame=10");
    const codigo = compresiones.shift() ?? 0;
    if (codigo === 0) await writeFile(salida, Buffer.alloc(5000));
    else await writeFile(salida, "a medias");
    return { codigo, salida: "", errores: "x264 falló" };
  }) as Ejecutor & { llamadas: string[][] };
  f.llamadas = llamadas;
  return f;
}

async function originalEnDisco(nombre = "orig.mov") {
  await mkdir(carpetaOriginales(), { recursive: true });
  await writeFile(path.join(carpetaOriginales(), nombre), MP4);
  return nombre;
}

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  for (const k of ["VIDEOS_CUOTA_GB", "VIDEOS_LIBRE_MINIMO_GB", "VIDEOS_TMP_DIR", "VIDEOS_PROCESADOR", "NEXT_PHASE", "PORT"]) delete process.env[k];
});

describe("permisos", () => {
  it("noticias, ferias o sorteos; nadie más", async () => {
    expect(puedeUsarVideos({ rol: "secretaria", permisos: ["ferias"] })).toBe(true);
    expect(puedeUsarVideos({ rol: "secretaria", permisos: ["sorteos"] })).toBe(true);
    expect(puedeUsarVideos({ rol: "secretaria", permisos: ["directorio"] })).toBe(false);
    iniciarSesionComo(await crearUsuario({ permisos: ["directorio"] }));
    expect((await espacioGET()).status).toBe(401);
    expect((await subir(peticionVideo(MP4))).status).toBe(401);
    expect((await estadoGET(peticion("/x"), params(1))).status).toBe(401);
    cerrarSesion();
    expect((await espacioGET()).status).toBe(401);
  });
});

describe("POST /api/administrador/videos (subida)", () => {
  it("guarda el original fuera de public/ y crea el video PENDIENTE", async () => {
    const res = await subir(peticionVideo(MP4, { "x-nombre-archivo": encodeURIComponent("Sorteo día 1.MP4") }));
    expect(res.status).toBe(201);
    const v = await res.json();
    expect(v).toMatchObject({ estado: "PENDIENTE", nombre_original: "Sorteo día 1.MP4", bytes_original: MP4.length });
    const fila = await prisma.video.findUniqueOrThrow({ where: { id: v.id } });
    expect(fila.original).toMatch(/^[\w-]+\.mp4$/);
    expect(existsSync(rutaOriginal(fila.original)!)).toBe(true);
    expect(rutaOriginal(fila.original)).not.toContain("public");
  });

  it("rechaza nombre, extensión, tamaño, cuerpo vacío o que no es video", async () => {
    await mkdir(carpetaOriginales(), { recursive: true });
    const antes = await readdir(carpetaOriginales());
    const error = async (r: Request) => {
      const res = await subir(r);
      expect(res.status).toBe(400);
      const m = (await res.json()).error as string;
      // ninguna subida rechazada deja su archivo en el disco
      expect([m, await readdir(carpetaOriginales())]).toEqual([m, antes]);
      return m;
    };
    expect(await error(peticionVideo(MP4, { "x-nombre-archivo": "" }))).toMatch(/no es un video/);
    expect(await error(peticionVideo(MP4, { "x-nombre-archivo": "%E0%A4%A" }))).toMatch(/no es un video/);
    expect(await error(peticionVideo(MP4, { "x-nombre-archivo": "virus.exe" }))).toMatch(/no es un video/);
    expect(await error(peticionVideo(MP4, { "content-length": "abc" }))).toMatch(/No llegó/);
    expect(await error(peticionVideo(MP4, { "content-length": String(2 * GB) }))).toMatch(/más de 1 GB/);
    expect(await error(peticionVideo(null, { "content-length": "10" }))).toMatch(/No llegó/);
    expect(await error(peticionVideo(Buffer.from("<html>no es un video</html>")))).toMatch(/no es un video/);
    expect(await error(peticionVideo(MP4, { "content-length": "10" }))).toMatch(/más grande de lo anunciado/);
    expect(await error(peticionVideo(MP4, { "content-length": String(MP4.length + 50) }))).toMatch(/se cortó/);
    expect(await prisma.video.count()).toBe(0);
  });

  it("conexión cortada a mitad de la subida", async () => {
    const cuerpo = new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(MP4.subarray(0, 50)));
        c.error(new Error("socket hang up"));
      },
    });
    const r = new Request("http://localhost/x", {
      method: "POST",
      headers: { "x-nombre-archivo": "a.mp4", "content-length": "500" },
      body: cuerpo,
      duplex: "half",
    } as RequestInit);
    const res = await subir(r);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/se cortó/);
  });

  it("error inesperado al escribir: 500 y queda en el registro", async () => {
    vi.spyOn(prisma.video, "create").mockRejectedValueOnce(new Error("BD caída"));
    const res = await subir(peticionVideo(MP4));
    expect(res.status).toBe(500);
    expect(await prisma.registro_actividad.count({ where: { nivel: "error" } })).toBe(1);
  });

  it("sin espacio: por cuota o por disco", async () => {
    process.env.VIDEOS_CUOTA_GB = "0.0000001"; // ~107 bytes
    expect((await (await subir(peticionVideo(MP4))).json()).error).toMatch(/límite de espacio para videos/);
    delete process.env.VIDEOS_CUOTA_GB;
    process.env.VIDEOS_LIBRE_MINIMO_GB = "100000000";
    expect((await (await subir(peticionVideo(MP4))).json()).error).toMatch(/quedando sin espacio en disco/);
  });
});

describe("espacio para videos", () => {
  it("suma los listos y los que esperan, con cuota y disco", async () => {
    await videoEnBD({ estado: "LISTO", bytes: 300 });
    await videoEnBD({ estado: "PENDIENTE", bytes_original: 1000 });
    await videoEnBD({ estado: "ERROR", bytes_original: 5000 });
    const res = await espacioGET();
    const e = await res.json();
    expect(e.usados).toBe(1300);
    expect(e.cuota).toBe(20 * GB);
    expect(e.libreDisco).toBeGreaterThan(0);
    expect(e.disponible).toBeGreaterThan(0);
  });

  it("variables de entorno, disco desconocido y textos", async () => {
    process.env.VIDEOS_CUOTA_GB = "2";
    process.env.VIDEOS_LIBRE_MINIMO_GB = "-1";
    expect(cuotaBytes()).toBe(2 * GB);
    expect(libreMinimoBytes()).toBe(5 * GB);
    expect(await libreEnDisco(path.join(process.cwd(), "no-existe"))).toBeNull();
    const e = await espacioVideos(path.join(process.cwd(), "no-existe"));
    expect(e).toMatchObject({ libreDisco: null, disponible: 2 * GB });
    await expect(verificarEspacio(10)).resolves.toBeUndefined();
    expect(textoTamano(3 * 1024 ** 2)).toBe("3 MB");
    expect(textoTamano(100)).toBe("1 MB");
    expect(textoTamano(1.5 * GB)).toBe("1,5 GB");
    expect(textoTamano(20 * GB)).toBe("20 GB");
  });

  it("vacía en la BD y error de la BD → 500", async () => {
    expect((await (await espacioGET()).json()).usados).toBe(0);
    vi.spyOn(prisma.video, "aggregate").mockRejectedValueOnce(new Error("x"));
    expect((await espacioGET()).status).toBe(500);
  });
});

describe("GET /api/administrador/videos/[id]", () => {
  it("estado, sin rutas internas; 400 / 404 / 500", async () => {
    const v = await videoEnBD({ original: "secreto.mov", estado: "PROCESANDO", progreso: 40 });
    const res = await estadoGET(peticion("/x"), params(v.id));
    const datos = await res.json();
    expect(datos).toMatchObject({ id: v.id, estado: "PROCESANDO", progreso: 40 });
    expect(datos.original).toBeUndefined();
    expect((await estadoGET(peticion("/x"), params("abc"))).status).toBe(400);
    expect((await estadoGET(peticion("/x"), params(999999))).status).toBe(404);
    vi.spyOn(prisma.video, "findUnique").mockRejectedValueOnce(new Error("x"));
    expect((await estadoGET(peticion("/x"), params(v.id))).status).toBe(500);
  });
});

describe("POST /api/interno/videos", () => {
  it("con la clave interna refresca las páginas públicas; sin ella, 401", async () => {
    etiquetasInvalidadas.length = 0;
    const ok = await interno(new Request("http://localhost/x", { method: "POST", headers: { "x-clave-interna": claveInterna() } }));
    expect(ok.status).toBe(200);
    expect(etiquetasInvalidadas).toEqual(["noticias", "ferias", "sorteos"]);
    expect((await interno(new Request("http://localhost/x", { method: "POST" }))).status).toBe(401);
    expect((await interno(new Request("http://localhost/x", { method: "POST", headers: { "x-clave-interna": "a".repeat(64) } }))).status).toBe(401);
  });

  it("el procesador la llama al puerto del sitio y no falla si no responde", async () => {
    const f = vi.fn().mockResolvedValue(new Response("{}"));
    process.env.PORT = "3200";
    await avisarAlSitio(f as unknown as typeof fetch);
    expect(f.mock.calls[0][0]).toBe("http://127.0.0.1:3200/api/interno/videos");
    expect(f.mock.calls[0][1].headers["x-clave-interna"]).toBe(claveInterna());
    delete process.env.PORT;
    await avisarAlSitio(vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch);
    await avisarAlSitio(vi.fn().mockResolvedValue(new Response("{}")) as unknown as typeof fetch);
  });

  it("clave con JWT_SECRET vacío no rompe", () => {
    const antes = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(claveInterna()).toHaveLength(64);
    process.env.JWT_SECRET = antes;
  });
});

describe("cola de compresión", () => {
  it("comprime: guarda MP4 + portada, datos del video, borra el original y avisa", async () => {
    const original = await originalEnDisco();
    const v = await videoEnBD({ original });
    const avisar = vi.fn().mockResolvedValue(undefined);
    const ejecutor = ejecutorFalso();
    expect(await procesarCola(ejecutor, avisar)).toBe(true);
    const listo = await prisma.video.findUniqueOrThrow({ where: { id: v.id } });
    expect(listo).toMatchObject({ estado: "LISTO", progreso: 100, bytes: 5000, duracion: 60, ancho: 1920, alto: 1080, original: null, intentos: 1 });
    expect(listo.url).toMatch(new RegExp(`^/uploads/videos/${v.id}-[0-9a-f]{12}\\.mp4$`));
    expect(listo.poster).toBe(listo.url!.replace(".mp4", ".jpg"));
    expect(existsSync(rutaDeUrl(listo.url)!)).toBe(true);
    expect(existsSync(path.join(carpetaOriginales(), original))).toBe(false);
    expect(avisar).toHaveBeenCalledOnce();
    // cola vacía
    expect(await procesarCola(ejecutor, avisar)).toBe(false);
  });

  it("sin portada si ffmpeg no la pudo sacar; avance guardado aunque falle la BD", async () => {
    const v = await videoEnBD({ original: await originalEnDisco() });
    const update = prisma.video.update.bind(prisma.video);
    vi.spyOn(prisma.video, "update")
      .mockImplementationOnce(() => Promise.reject(new Error("BD ocupada")) as never)
      .mockImplementation(update as never);
    expect(await comprimir(v, ejecutorFalso({ portada: 1 }))).toBe("LISTO");
    expect((await prisma.video.findUniqueOrThrow({ where: { id: v.id } })).poster).toBeNull();
  });

  it("errores: sin original, no es video, muy largo, ffmpeg falla, sin ffmpeg", async () => {
    const casos: [Parameters<typeof ejecutorFalso>[0], string | null, string][] = [
      [{}, null, MENSAJES.sinOriginal],
      [{ sonda: { streams: [] } }, "a.mov", MENSAJES.noEsVideo],
      [{ codigoSonda: 1 }, "b.mov", MENSAJES.noEsVideo],
      [{ sonda: { streams: [{ codec_type: "video", width: 1, height: 1 }], format: { duration: "0" } } }, "c.mov", MENSAJES.noEsVideo],
      [{ sonda: { streams: [{ codec_type: "video", width: 1, height: 1 }], format: { duration: "1200" } } }, "d.mov", MENSAJES.muyLargo(20)],
      [{ compresion: [1] }, "e.mov", MENSAJES.fallo],
      [{ enoent: "sonda" }, "f.mov", MENSAJES.sinPrograma],
      [{ enoent: "ffmpeg" }, "g.mov", MENSAJES.sinPrograma],
    ];
    const fallidos: number[] = [];
    for (const [opciones, archivo, mensaje] of casos) {
      if (archivo) await originalEnDisco(archivo);
      const v = await videoEnBD({ original: archivo ?? "no-existe.mov" });
      fallidos.push(v.id);
      expect(await comprimir(v, ejecutorFalso(opciones))).toBe("ERROR");
      const fila = await prisma.video.findUniqueOrThrow({ where: { id: v.id } });
      expect(fila).toMatchObject({ estado: "ERROR", error: mensaje, original: null });
      if (archivo) expect(existsSync(path.join(carpetaOriginales(), archivo))).toBe(false);
    }
    // nombre de original inválido
    const raro = await videoEnBD({ original: "../../etc/passwd" });
    expect(await comprimir(raro, ejecutorFalso())).toBe("ERROR");
    // el MP4 a medias de un ffmpeg que falló no queda en el disco
    const quedan = await readdir(carpetaPublica());
    expect(quedan.filter((n) => fallidos.some((id) => n.startsWith(`${id}-`)))).toEqual([]);
  });

  it("HDR: si el filtro no existe, reintenta sin pasar a SDR", async () => {
    const v = await videoEnBD({ original: await originalEnDisco() });
    const ejecutor = ejecutorFalso({
      sonda: { streams: [{ codec_type: "video", width: 1080, height: 1920, color_transfer: "arib-std-b67" }], format: { duration: "10" } },
      compresion: [1, 0],
    });
    expect(await comprimir(v, ejecutor)).toBe("LISTO");
    const compresiones = ejecutor.llamadas.filter((a) => a.includes("libx264"));
    expect(compresiones[0].join(" ")).toContain("tonemap");
    expect(compresiones[1].join(" ")).not.toContain("tonemap");
  });

  it("un error inesperado queda como ERROR (y si ni eso se puede guardar, no revienta)", async () => {
    const v = await videoEnBD({ original: await originalEnDisco() });
    const roto: Ejecutor = async () => {
      throw new Error("inesperado");
    };
    expect(await comprimir(v, roto)).toBe("ERROR");
    expect((await prisma.video.findUniqueOrThrow({ where: { id: v.id } })).error).toBe(MENSAJES.fallo);
    const v2 = await videoEnBD({ original: await originalEnDisco("z.mov") });
    vi.spyOn(prisma.video, "update").mockRejectedValue(new Error("BD caída"));
    expect(await comprimir(v2, roto)).toBe("ERROR");
  });

  it("procesarCola: si falla no avisa (y usa el ffmpeg real por defecto)", async () => {
    const avisar = vi.fn();
    await videoEnBD({ original: "no-existe.mov" });
    expect(await procesarCola(undefined, avisar)).toBe(true);
    expect(avisar).not.toHaveBeenCalled();
  });

  it("reclamar: de a uno, y no si otro proceso está comprimiendo", async () => {
    const a = await videoEnBD();
    const b = await videoEnBD();
    expect((await reclamarSiguiente())?.id).toBe(a.id);
    expect(await reclamarSiguiente()).toBeNull(); // a está PROCESANDO con latido fresco
    await prisma.video.update({ where: { id: a.id }, data: { estado: "LISTO" } });
    // Otro proceso lo toma justo antes (el UPDATE condicionado no afecta filas)
    const updateMany = prisma.video.updateMany.bind(prisma.video);
    vi.spyOn(prisma.video, "updateMany").mockResolvedValueOnce({ count: 0 }).mockImplementation(updateMany as never);
    expect(await reclamarSiguiente()).toBeNull();
    expect((await reclamarSiguiente())?.id).toBe(b.id);
  });

  it("recuperar abandonados: vuelven a la cola, o ERROR tras 3 intentos", async () => {
    const viejo = new Date(Date.now() - 10 * 60 * 1000);
    const a = await videoEnBD({ estado: "PROCESANDO", latido: viejo, intentos: 1, progreso: 50 });
    const b = await videoEnBD({ estado: "PROCESANDO", latido: null, intentos: MAX_INTENTOS });
    const c = await videoEnBD({ estado: "PROCESANDO", latido: new Date(), intentos: 1 });
    await recuperarAbandonados();
    expect((await prisma.video.findUniqueOrThrow({ where: { id: a.id } }))).toMatchObject({ estado: "PENDIENTE", progreso: 0 });
    expect((await prisma.video.findUniqueOrThrow({ where: { id: b.id } }))).toMatchObject({ estado: "ERROR", error: MENSAJES.fallo });
    expect((await prisma.video.findUniqueOrThrow({ where: { id: c.id } })).estado).toBe("PROCESANDO");
  });
});

describe("iniciarProcesador", () => {
  it("no arranca en el build ni con VIDEOS_PROCESADOR=0; arranca una sola vez", async () => {
    const g = globalThis as { __procesadorVideos?: boolean };
    delete g.__procesadorVideos;
    process.env.VIDEOS_PROCESADOR = "0";
    expect(iniciarProcesador()).toBe(false);
    delete process.env.VIDEOS_PROCESADOR;
    process.env.NEXT_PHASE = "phase-production-build";
    expect(iniciarProcesador()).toBe(false);
    delete process.env.NEXT_PHASE;

    vi.useFakeTimers({ toFake: ["setTimeout"] });
    expect(iniciarProcesador()).toBe(true);
    expect(iniciarProcesador()).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    // corre la vuelta y, al terminar, programa la siguiente
    await vi.advanceTimersByTimeAsync(5000);
    await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
    vi.useRealTimers();
    delete g.__procesadorVideos;
  });

  it("cada vuelta limpia (a lo más cada media hora) y vacía la cola; un error no la detiene", async () => {
    const estado = { ultimaLimpieza: 0 };
    await vueltaDelProcesador(estado, 1_000_000_000);
    expect(estado.ultimaLimpieza).toBe(1_000_000_000);
    await vueltaDelProcesador(estado, 1_000_000_000 + 60_000);
    expect(estado.ultimaLimpieza).toBe(1_000_000_000);
    vi.spyOn(prisma.video, "updateMany").mockRejectedValueOnce(new Error("BD caída"));
    await expect(vueltaDelProcesador(estado, 1_000_000_000 + 60_000)).resolves.toBeUndefined();
  });
});

describe("limpieza de videos huérfanos", () => {
  const hace2dias = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  it("borra los que nadie usa (ni la papelera) y archivos sueltos viejos", async () => {
    await mkdir(carpetaPublica(), { recursive: true });
    const archivoPub = async (nombre: string, viejo = true) => {
      const ruta = path.join(carpetaPublica(), nombre);
      await writeFile(ruta, "x");
      if (viejo) await utimes(ruta, hace2dias, hace2dias);
      return ruta;
    };
    // huérfano viejo con archivos → se borra
    const mp4 = await archivoPub("1-a.mp4");
    const jpg = await archivoPub("1-a.jpg");
    const orig = await originalEnDisco("huerfano.mov");
    await videoEnBD({ estado: "LISTO", url: "/uploads/videos/1-a.mp4", poster: "/uploads/videos/1-a.jpg", original: orig, creado_en: hace2dias });
    // huérfano reciente → se queda (formulario aún abierto)
    const reciente = await videoEnBD({ creado_en: new Date(), original: "reciente.mov" });
    // huérfano viejo cuyo archivo ya no estaba
    await videoEnBD({ estado: "LISTO", url: "/uploads/videos/9-ya-no-esta.mp4", creado_en: hace2dias });
    // en uso por una noticia viva / por la papelera / procesándose → se quedan
    const usado = await videoEnBD({ estado: "LISTO", url: "/uploads/videos/2-b.mp4", creado_en: hace2dias });
    await archivoPub("2-b.mp4");
    await prisma.noticia.create({ data: { titulo: "N", descripcion: "d", autor: "a", updatedAt: new Date(), video_id: usado.id } });
    const enPapelera = await videoEnBD({ creado_en: hace2dias });
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026, video_id: enPapelera.id } });
    await moverAPapelera("sorteos", s.id);
    const procesando = await videoEnBD({ estado: "PROCESANDO", creado_en: hace2dias });
    // archivos sueltos: viejo → se borra; reciente → se queda
    const suelto = await archivoPub("suelto.mp4");
    const sueltoNuevo = await archivoPub("nuevo.mp4", false);
    await mkdir(path.join(carpetaPublica(), "subcarpeta"), { recursive: true });
    await prisma.papelera.create({ data: { modulo: "directorio", entidadId: 9, titulo: "x", datos: {}, archivos: [], expiraEn: new Date() } });

    const r = await limpiarVideos();
    expect(r).toEqual({ videos: 2, archivos: 1 });
    expect([mp4, jpg, suelto, path.join(carpetaOriginales(), orig)].map(existsSync)).toEqual([false, false, false, false]);
    expect(existsSync(sueltoNuevo)).toBe(true);
    const quedan = (await prisma.video.findMany()).map((v) => v.id).sort();
    expect(quedan).toEqual([reciente.id, usado.id, enPapelera.id, procesando.id].sort());
    expect(await videosEnUso()).toEqual(new Set([usado.id, enPapelera.id]));
  });

  it("sin carpetas todavía, sin nada que hacer", async () => {
    process.env.VIDEOS_TMP_DIR = path.join(process.cwd(), "no-existe-aun");
    await rm(carpetaPublica(), { recursive: true, force: true });
    expect(await limpiarVideos()).toEqual({ videos: 0, archivos: 0 });
  });

  it("ferias en uso y borrado que falla en la BD", async () => {
    const v = await videoEnBD({ creado_en: hace2dias });
    await prisma.evento_feria.create({ data: { titulo: "F", descripcion: "d", anio: 2026, video_id: v.id } });
    const huerfano = await videoEnBD({ creado_en: hace2dias });
    vi.spyOn(prisma.video, "delete").mockRejectedValueOnce(new Error("x"));
    expect((await limpiarVideos()).videos).toBe(1);
    expect(await prisma.video.count({ where: { id: huerfano.id } })).toBe(1);
  });
});

describe("rutas seguras", () => {
  it("solo nombres simples dentro de las carpetas de videos", () => {
    expect(rutaDeUrl("/uploads/videos/1-ab.mp4")).toBe(path.join(carpetaPublica(), "1-ab.mp4"));
    expect(rutaDeUrl("/uploads/videos/../x")).toBeNull();
    expect(rutaDeUrl("/uploads/videos/..")).toBeNull();
    expect(rutaDeUrl("/uploads/noticias/a.jpg")).toBeNull();
    expect(rutaDeUrl(null)).toBeNull();
    expect(rutaOriginal("abc.mov")).toBe(path.join(carpetaOriginales(), "abc.mov"));
    expect(rutaOriginal("..")).toBeNull();
    expect(rutaOriginal("a/b")).toBeNull();
    expect(rutaOriginal(undefined)).toBeNull();
  });

  it("reconoce videos por sus primeros bytes", () => {
    expect(pareceVideo(MP4)).toBe(true);
    expect(pareceVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);
    expect(pareceVideo(Buffer.from("RIFF\0\0\0\0AVI "))).toBe(true);
    expect(pareceVideo(Buffer.from("RIFF\0\0\0\0WAVE"))).toBe(false);
    expect(pareceVideo(Buffer.from("corto"))).toBe(false);
    expect(extensionValida("a.MOV")).toBe(true);
    expect(extensionValida("a.gif")).toBe(false);
    expect(nombreDeCabecera(null)).toBe("");
    expect(nombreDeCabecera(encodeURIComponent("C:\\fotos\\mi video.mp4"))).toBe("mi video.mp4");
  });
});

describe("unir el video a noticias, ferias y sorteos", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.append(k, v);
    return f;
  };

  it("lee el formulario: videoId, quitarVideo o nada", () => {
    expect(cambioVideoDeFormulario(fd({ videoId: "7" }))).toBe(7);
    expect(cambioVideoDeFormulario(fd({ videoId: "7", quitarVideo: "1" }))).toBeNull();
    expect(cambioVideoDeFormulario(fd({ videoId: "x" }))).toBeUndefined();
    expect(cambioVideoDeFormulario(fd({}))).toBeUndefined();
  });

  it("valida que exista y no tenga error", async () => {
    const malo = await videoEnBD({ estado: "ERROR", error: "dura mucho" });
    const maloSinTexto = await videoEnBD({ estado: "ERROR" });
    await expect(validarCambioVideo(999999)).rejects.toThrow(VideoError);
    await expect(validarCambioVideo(malo.id)).rejects.toThrow("dura mucho");
    await expect(validarCambioVideo(maloSinTexto.id)).rejects.toThrow(/tuvo un problema/);
    await expect(validarCambioVideo(null)).resolves.toBeNull();
    await expect(validarCambioVideo(undefined)).resolves.toBeUndefined();
  });

  it("solo los videos LISTO llegan al sitio público", () => {
    const base = { url: "/uploads/videos/a.mp4", poster: null, duracion: 5, ancho: 1280, alto: 720 };
    expect(videoPublico({ ...base, estado: "LISTO" })).toEqual(base);
    expect(videoPublico({ ...base, estado: "PROCESANDO" })).toBeNull();
    expect(videoPublico({ ...base, estado: "LISTO", url: null })).toBeNull();
    expect(videoPublico(null)).toBeNull();
  });

  it("noticia: crear con video, quitarlo, ponerlo; en el sitio solo si está listo; video inválido → 400", async () => {
    const v = await videoEnBD({ estado: "LISTO", url: "/uploads/videos/n.mp4" });
    const res = await crearNoticia(peticion("/x", "POST", { form: { titulo: "Con video", descripcion: "d", videoId: String(v.id) } }));
    const n = await res.json();
    expect(n.video_id).toBe(v.id);
    expect(n.video).toMatchObject({ id: v.id, estado: "LISTO" });
    expect((await NoticiasController.obtenerNoticiaPorId(n.id))?.video).toMatchObject({ url: "/uploads/videos/n.mp4" });

    const put = (form: Record<string, string>) => editarNoticia(new NextRequest(peticion("/x", "PUT", { form: { titulo: "Con video", descripcion: "d", ...form } })), params(n.id));
    expect((await (await put({ quitarVideo: "1" })).json()).video_id).toBeNull();
    const p = await videoEnBD({ estado: "PENDIENTE" });
    expect((await (await put({ videoId: String(p.id) })).json()).video_id).toBe(p.id);
    expect((await NoticiasController.obtenerNoticiaPorId(n.id))?.video).toBeNull();
    // sin campos de video: no cambia
    expect((await (await put({})).json()).video_id).toBe(p.id);
    const r400 = await put({ videoId: "999999" });
    expect(r400.status).toBe(400);
    expect((await r400.json()).message).toMatch(/ya no está en el servidor/);
    expect((await crearNoticia(peticion("/x", "POST", { form: { titulo: "X", descripcion: "d", videoId: "999999" } }))).status).toBe(400);
  });

  it("feria: crear y editar con video; público solo si está listo", async () => {
    const v = await videoEnBD({ estado: "LISTO", url: "/uploads/videos/f.mp4" });
    const res = await crearFeria(peticion("/x", "POST", { form: { titulo: "Feria", descripcion: "<p>d</p>", anio: "2026", videoId: String(v.id) } }));
    const f = await res.json();
    expect(f.video_id).toBe(v.id);
    const publicas = await FeriaController.obtenerFeriasPublicas({ anioParam: null, pageParam: null });
    expect(publicas[0].video).toMatchObject({ url: "/uploads/videos/f.mp4" });
    const put = (form: Record<string, string>) => editarFeria(new NextRequest(peticion("/x", "PUT", { form: { titulo: "Feria", descripcion: "<p>d</p>", ...form } })), { params: Promise.resolve({ id: String(f.id) }) });
    expect((await (await put({ quitarVideo: "1" })).json()).video_id).toBeNull();
    expect((await put({ videoId: "999999" })).status).toBe(400);
    expect((await crearFeria(peticion("/x", "POST", { form: { titulo: "F2", descripcion: "<p>d</p>", anio: "2026", videoId: "999999" } }))).status).toBe(400);
  });

  it("sorteo: crear y editar con video; público solo si está listo", async () => {
    const v = await videoEnBD({ estado: "LISTO", url: "/uploads/videos/s.mp4" });
    const base = { nombre: "Sorteo", descripcion: "d", lugar: "Sede", fecha_hora: "2026-12-20T19:00:00-05:00" };
    const s = await (await crearSorteo(peticion("/x", "POST", { form: { ...base, videoId: String(v.id) } }))).json();
    expect(s.video_id).toBe(v.id);
    expect((await SorteoController.obtenerSorteosPublicos(null))[0].video).toMatchObject({ url: "/uploads/videos/s.mp4" });
    const put = (form: Record<string, string>) => editarSorteo(new NextRequest(peticion("/x", "PUT", { form: { ...base, ...form } })), params(s.id));
    expect((await (await put({ quitarVideo: "1" })).json()).video_id).toBeNull();
    expect((await put({ videoId: "999999" })).status).toBe(400);
    expect((await crearSorteo(peticion("/x", "POST", { form: { ...base, videoId: "999999" } }))).status).toBe(400);
    // JSON: sin video
    const j = await (await crearSorteo(peticion("/x", "POST", { json: { ...base } }))).json();
    expect(j.video_id).toBeNull();
  });

  it("papelera: al restaurar vuelve con su video (o sin él si ya no existe)", async () => {
    const v = await videoEnBD({ estado: "LISTO" });
    const n = await prisma.noticia.create({ data: { titulo: "N", descripcion: "d", autor: "a", updatedAt: new Date(), video_id: v.id } });
    const f = await prisma.evento_feria.create({ data: { titulo: "F", descripcion: "d", anio: 2026, video_id: v.id } });
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026 } });
    for (const [modulo, id] of [["noticias", n.id], ["ferias", f.id], ["sorteos", s.id]] as const) await moverAPapelera(modulo, id);
    const entradas = await prisma.papelera.findMany({ orderBy: { id: "asc" } });
    await restaurarDePapelera(entradas[0].id);
    expect((await prisma.noticia.findUniqueOrThrow({ where: { id: n.id } })).video_id).toBe(v.id);
    await prisma.video.delete({ where: { id: v.id } });
    await restaurarDePapelera(entradas[1].id);
    expect((await prisma.evento_feria.findUniqueOrThrow({ where: { id: f.id } })).video_id).toBeNull();
    await restaurarDePapelera(entradas[2].id);
    expect((await prisma.sorteo.findUniqueOrThrow({ where: { id: s.id } })).video_id).toBeNull();
  });
});
