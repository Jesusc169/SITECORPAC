/**
 * Cómo se comprime cada video que sube la secretaría (programa ffmpeg,
 * instalado en el servidor con `apt install ffmpeg`).
 *
 * Un video de celular pesa 100-300 MB por minuto (1080p o 4K, 15-50 Mbps).
 * En la web se ve igual de bien a 720p con H.264, que reproduce cualquier
 * celular o navegador, y queda en unos 6-10 MB por minuto:
 *  - lado corto a 720 px como máximo (vertical u horizontal, sin deformar);
 *  - CRF 26 = calidad constante, buena a la vista; con tope de 2,5 Mbps para
 *    que las escenas con mucho movimiento (una multitud) no se disparen;
 *  - 30 cuadros por segundo como máximo (los de 60 fps pesan el doble);
 *  - audio AAC 96 kbps estéreo (voces y aplausos se oyen bien);
 *  - +faststart: empieza a reproducirse antes de terminar de descargarse;
 *  - -map_metadata -1: quita los datos del celular, incluida la ubicación
 *    GPS de donde se grabó (dato personal, Ley 29733).
 */
import { spawn as spawnReal } from "child_process";
import os from "os";

export const LADO_CORTO_MAXIMO = 720;
export const CRF = 26;

const ESCALA =
  `scale=w='if(gt(iw,ih),-2,min(${LADO_CORTO_MAXIMO},iw))'` +
  `:h='if(gt(iw,ih),min(${LADO_CORTO_MAXIMO},ih),-2)'`;

// Videos HDR (iPhone, algunos Android): sin convertir a SDR se verían
// lavados en pantallas normales.
const A_SDR =
  "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709," +
  "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv";

export interface Sonda {
  duracion: number;
  ancho: number;
  alto: number;
  tieneAudio: boolean;
  hdr: boolean;
}

/** Lee la salida JSON de `ffprobe`. null si no hay pista de video. */
export function interpretarSonda(salida: string): Sonda | null {
  let datos: {
    streams?: { codec_type?: string; width?: number; height?: number; color_transfer?: string; tags?: { rotate?: string }; side_data_list?: { rotation?: number }[] }[];
    format?: { duration?: string };
  };
  try {
    datos = JSON.parse(salida);
  } catch {
    return null;
  }
  const pistas = datos.streams ?? [];
  const video = pistas.find((p) => p.codec_type === "video" && p.width && p.height);
  if (!video) return null;
  const duracion = Number(datos.format?.duration);
  // Celular en vertical: graba 1920x1080 con una marca de "girar 90°"
  const giro = Math.abs(Number(video.tags?.rotate ?? video.side_data_list?.find((s) => s.rotation !== undefined)?.rotation ?? 0));
  const girado = giro === 90 || giro === 270;
  return {
    duracion: Number.isFinite(duracion) ? duracion : 0,
    ancho: girado ? video.height! : video.width!,
    alto: girado ? video.width! : video.height!,
    tieneAudio: pistas.some((p) => p.codec_type === "audio"),
    hdr: video.color_transfer === "arib-std-b67" || video.color_transfer === "smpte2084",
  };
}

export function argumentosSonda(entrada: string): string[] {
  return ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", entrada];
}

export function argumentosCompresion(entrada: string, salida: string, opciones: { tieneAudio: boolean; hdr: boolean }): string[] {
  const filtros = [opciones.hdr ? A_SDR : null, ESCALA, "format=yuv420p", "setsar=1"].filter(Boolean).join(",");
  return [
    "-hide_banner", "-y",
    "-i", entrada,
    "-map", "0:v:0",
    ...(opciones.tieneAudio ? ["-map", "0:a:0"] : []),
    "-map_metadata", "-1",
    "-sn", "-dn",
    "-vf", filtros,
    "-fpsmax", "30",
    "-c:v", "libx264", "-preset", "medium", "-crf", String(CRF),
    "-maxrate", "2500k", "-bufsize", "5000k",
    "-profile:v", "high", "-level", "4.0",
    ...(opciones.tieneAudio ? ["-c:a", "aac", "-b:a", "96k", "-ac", "2"] : ["-an"]),
    "-movflags", "+faststart",
    "-progress", "pipe:1", "-nostats",
    salida,
  ];
}

/** Imagen de portada (lo que se ve antes de darle play), del video ya comprimido. */
export function argumentosPortada(video: string, salida: string, segundo: number): string[] {
  return ["-hide_banner", "-y", "-ss", segundo.toFixed(2), "-i", video, "-frames:v", "1", "-q:v", "4", salida];
}

/** Segundo del que se toma la portada: 1 s, o la mitad si el video es más corto. */
export function segundoPortada(duracion: number): number {
  return Math.min(1, Math.max(0, duracion / 2));
}

/** "out_time_us=12000000" con duración 60 s → 20. null si la línea no es de avance. */
export function progresoDeLinea(linea: string, duracion: number): number | null {
  const m = /^out_time_(?:us|ms)=(\d+)/.exec(linea.trim());
  if (!m || duracion <= 0) return null;
  // ffmpeg informa out_time_ms también en microsegundos (error histórico)
  const segundos = Number(m[1]) / 1_000_000;
  return Math.max(0, Math.min(99, Math.floor((segundos / duracion) * 100)));
}

export interface Resultado {
  codigo: number | null;
  salida: string;
  errores: string;
}

export type Ejecutor = (
  programa: string,
  argumentos: string[],
  opciones?: { alLeerLinea?: (linea: string) => void; limiteMs?: number }
) => Promise<Resultado>;

/**
 * Ejecuta ffmpeg/ffprobe con la prioridad más baja del sistema: el sitio
 * sigue respondiendo rápido mientras se comprime. Nunca rechaza: si el
 * programa no existe o se pasa del tiempo, devuelve código distinto de 0.
 */
export const ejecutar: Ejecutor = (programa, argumentos, opciones = {}) =>
  new Promise((resolve) => {
    let salida = "";
    let errores = "";
    let pendiente = "";
    let terminado = false;
    const fin = (codigo: number | null, extra = "") => {
      if (terminado) return;
      terminado = true;
      clearTimeout(reloj);
      resolve({ codigo, salida, errores: (errores + extra).slice(-4000) });
    };
    const hijo = spawnReal(programa, argumentos, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const reloj = setTimeout(() => {
      hijo.kill("SIGKILL");
      fin(null, "\nSe pasó del tiempo máximo");
    }, opciones.limiteMs ?? 2 * 60 * 60 * 1000);
    try {
      if (hijo.pid) os.setPriority(hijo.pid, 19);
    } catch {
      // sin permiso para cambiar la prioridad: sigue igual
    }
    hijo.stdout.on("data", (d: Buffer) => {
      const texto = d.toString();
      salida = (salida + texto).slice(-200_000);
      pendiente += texto;
      const lineas = pendiente.split("\n");
      pendiente = lineas.pop() as string;
      for (const l of lineas) opciones.alLeerLinea?.(l);
    });
    hijo.stderr.on("data", (d: Buffer) => {
      errores = (errores + d.toString()).slice(-4000);
    });
    hijo.on("error", (e) => fin(null, "\n" + e.message));
    hijo.on("close", (codigo) => fin(codigo));
  });

export const programaFfmpeg = () => process.env.FFMPEG_PATH || "ffmpeg";
export const programaFfprobe = () => process.env.FFPROBE_PATH || "ffprobe";
