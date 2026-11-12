import { describe, it, expect, vi, afterEach } from "vitest";
import os from "os";
import {
  interpretarSonda,
  argumentosSonda,
  argumentosCompresion,
  argumentosPortada,
  segundoPortada,
  progresoDeLinea,
  ejecutar,
  programaFfmpeg,
  programaFfprobe,
} from "@/lib/videos/ffmpeg";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.FFMPEG_PATH;
  delete process.env.FFPROBE_PATH;
});

const sonda = (streams: unknown[], duration?: string) => JSON.stringify({ streams, format: duration ? { duration } : {} });

describe("interpretarSonda", () => {
  it("video horizontal con audio", () => {
    expect(interpretarSonda(sonda([{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }], "61.5"))).toEqual({
      duracion: 61.5, ancho: 1920, alto: 1080, tieneAudio: true, hdr: false,
    });
  });

  it("celular en vertical (rotate 90 en tags o -90 en side_data) y HDR", () => {
    expect(interpretarSonda(sonda([{ codec_type: "video", width: 1920, height: 1080, tags: { rotate: "90" }, color_transfer: "arib-std-b67" }], "5"))).toMatchObject({
      ancho: 1080, alto: 1920, tieneAudio: false, hdr: true,
    });
    expect(interpretarSonda(sonda([{ codec_type: "video", width: 1920, height: 1080, side_data_list: [{}, { rotation: -90 }], color_transfer: "smpte2084" }], "5"))).toMatchObject({
      ancho: 1080, alto: 1920, hdr: true,
    });
    expect(interpretarSonda(sonda([{ codec_type: "video", width: 1920, height: 1080, side_data_list: [{ rotation: 180 }] }], "5"))).toMatchObject({ ancho: 1920 });
  });

  it("sin duración, sin pistas, sin video o JSON roto", () => {
    expect(interpretarSonda(sonda([{ codec_type: "video", width: 10, height: 10 }]))?.duracion).toBe(0);
    expect(interpretarSonda(JSON.stringify({}))).toBeNull();
    expect(interpretarSonda(sonda([{ codec_type: "audio" }, { codec_type: "video" }], "3"))).toBeNull();
    expect(interpretarSonda("no es json")).toBeNull();
  });
});

describe("argumentos de ffmpeg", () => {
  it("compresión: 720p H.264, sin metadatos, con o sin audio, HDR → SDR", () => {
    const con = argumentosCompresion("in.mov", "out.mp4", { tieneAudio: true, hdr: false });
    expect(con.join(" ")).toContain("-map 0:a:0");
    expect(con.join(" ")).toContain("-map_metadata -1");
    expect(con.join(" ")).toContain("-c:v libx264 -preset medium -crf 26");
    expect(con.join(" ")).toContain("-c:a aac -b:a 96k");
    expect(con.join(" ")).toContain("-movflags +faststart");
    expect(con[con.indexOf("-vf") + 1]).toMatch(/^scale=.*720.*format=yuv420p,setsar=1$/);
    expect(con.at(-1)).toBe("out.mp4");

    const sin = argumentosCompresion("in.mov", "out.mp4", { tieneAudio: false, hdr: true });
    expect(sin).toContain("-an");
    expect(sin).not.toContain("0:a:0");
    expect(sin[sin.indexOf("-vf") + 1]).toMatch(/^zscale=.*tonemap=/);
  });

  it("sonda, portada y segundo de la portada", () => {
    expect(argumentosSonda("a.mp4")).toEqual(["-v", "error", "-print_format", "json", "-show_format", "-show_streams", "a.mp4"]);
    expect(argumentosPortada("v.mp4", "p.jpg", 1)).toEqual(["-hide_banner", "-y", "-ss", "1.00", "-i", "v.mp4", "-frames:v", "1", "-q:v", "4", "p.jpg"]);
    expect(segundoPortada(60)).toBe(1);
    expect(segundoPortada(1)).toBe(0.5);
    expect(segundoPortada(-3)).toBe(0);
  });

  it("progreso desde la salida de -progress", () => {
    expect(progresoDeLinea("out_time_us=30000000", 60)).toBe(50);
    expect(progresoDeLinea(" out_time_ms=90000000\r", 60)).toBe(99);
    expect(progresoDeLinea("frame=12", 60)).toBeNull();
    expect(progresoDeLinea("out_time_us=1", 0)).toBeNull();
  });

  it("rutas de los programas (por defecto o por variable de entorno)", () => {
    expect(programaFfmpeg()).toBe("ffmpeg");
    expect(programaFfprobe()).toBe("ffprobe");
    process.env.FFMPEG_PATH = "/opt/ffmpeg";
    process.env.FFPROBE_PATH = "/opt/ffprobe";
    expect(programaFfmpeg()).toBe("/opt/ffmpeg");
    expect(programaFfprobe()).toBe("/opt/ffprobe");
  });
});

describe("ejecutar", () => {
  const node = process.execPath;

  it("devuelve código, salida y errores, y pasa cada línea de la salida", async () => {
    const lineas: string[] = [];
    const r = await ejecutar(node, ["-e", "process.stdout.write('a=1\\nb=2\\nresto'); process.stderr.write('falla'); process.exit(3)"], {
      alLeerLinea: (l) => lineas.push(l),
    });
    expect(r.codigo).toBe(3);
    expect(r.salida).toBe("a=1\nb=2\nresto");
    expect(r.errores).toBe("falla");
    expect(lineas).toEqual(["a=1", "b=2"]);
  });

  it("sin alLeerLinea y con salida 0", async () => {
    const r = await ejecutar(node, ["-e", "console.log('ok')"]);
    expect(r).toMatchObject({ codigo: 0 });
  });

  it("programa inexistente: código null y ENOENT", async () => {
    const r = await ejecutar("programa-que-no-existe-xyz", []);
    expect(r.codigo).toBeNull();
    expect(r.errores).toMatch(/ENOENT/);
  });

  it("se pasa del tiempo: lo corta", async () => {
    const r = await ejecutar(node, ["-e", "setTimeout(() => {}, 20000)"], { limiteMs: 300 });
    expect(r.codigo).toBeNull();
    expect(r.errores).toMatch(/tiempo máximo/);
  });

  it("si no se puede bajar la prioridad, sigue igual", async () => {
    vi.spyOn(os, "setPriority").mockImplementation(() => {
      throw new Error("EACCES");
    });
    expect((await ejecutar(node, ["-e", "0"])).codigo).toBe(0);
  });
});
