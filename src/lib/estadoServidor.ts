/**
 * Datos del servidor para la pantalla /admin/sistema: versión desplegada,
 * memoria, disco, respaldos, archivos subidos y certificado HTTPS.
 *
 * Cada función devuelve null (o un campo `error`) en vez de lanzar, para que
 * si algo no se puede leer (por ejemplo en local, donde no existe la carpeta
 * de respaldos) la pantalla igual cargue y solo marque "No disponible".
 */
import fs from "fs/promises";
import path from "path";
import os from "os";
import tls from "tls";

// Las rutas se arman en tiempo de ejecución: los comentarios turbopackIgnore
// evitan que el build intente rastrear todo el proyecto por esas lecturas.
const RAIZ = process.cwd();

export interface Version {
  commit: string | null;
  compilado: string | null;
}

/** Commit desplegado (leído de .git) y hora de la última compilación. */
export async function leerVersion(): Promise<Version> {
  let commit: string | null = null;
  try {
    const head = (await fs.readFile(path.join(/*turbopackIgnore: true*/ RAIZ, ".git", "HEAD"), "utf8")).trim();
    if (head.startsWith("ref: ")) {
      const ref = head.slice(5);
      try {
        commit = (await fs.readFile(path.join(/*turbopackIgnore: true*/ RAIZ, ".git", ref), "utf8")).trim();
      } catch {
        const packed = await fs.readFile(path.join(/*turbopackIgnore: true*/ RAIZ, ".git", "packed-refs"), "utf8");
        commit = packed.split("\n").find((l) => l.endsWith(` ${ref}`))?.split(" ")[0] ?? null;
      }
    } else {
      commit = head;
    }
  } catch {
    commit = null;
  }

  let compilado: string | null = null;
  try {
    compilado = (await fs.stat(path.join(/*turbopackIgnore: true*/ RAIZ, ".next", "BUILD_ID"))).mtime.toISOString();
  } catch {
    compilado = null;
  }

  return { commit: commit ? commit.slice(0, 7) : null, compilado };
}

async function sistemaOperativo(): Promise<string> {
  try {
    const txt = await fs.readFile("/etc/os-release", "utf8");
    const m = txt.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
    if (m) return m[1];
  } catch {
    // no es Linux (por ejemplo, desarrollo en Windows)
  }
  return `${os.type()} ${os.release()}`;
}

export interface EstadoMaquina {
  sistema: string;
  node: string;
  servidorActivoSeg: number;
  procesoActivoSeg: number;
  instancia: string | null;
  memoriaTotal: number;
  memoriaLibre: number;
  memoriaProceso: number;
  cargaPromedio: number[];
  cpus: number;
  discoTotal: number | null;
  discoLibre: number | null;
}

export async function estadoMaquina(): Promise<EstadoMaquina> {
  let discoTotal: number | null = null;
  let discoLibre: number | null = null;
  try {
    const st = await fs.statfs(/*turbopackIgnore: true*/ RAIZ);
    discoTotal = st.blocks * st.bsize;
    discoLibre = st.bavail * st.bsize;
  } catch {
    // statfs no disponible
  }

  return {
    sistema: await sistemaOperativo(),
    node: process.version,
    servidorActivoSeg: Math.round(os.uptime()),
    procesoActivoSeg: Math.round(process.uptime()),
    instancia: process.env.NODE_APP_INSTANCE ?? null,
    memoriaTotal: os.totalmem(),
    memoriaLibre: os.freemem(),
    memoriaProceso: process.memoryUsage().rss,
    cargaPromedio: os.loadavg().map((n) => Math.round(n * 100) / 100),
    cpus: os.cpus().length,
    discoTotal,
    discoLibre,
  };
}

async function medirCarpeta(dir: string): Promise<{ archivos: number; bytes: number }> {
  let archivos = 0;
  let bytes = 0;
  const pendientes = [dir];
  while (pendientes.length) {
    const actual = pendientes.pop() as string;
    let entradas;
    try {
      entradas = await fs.readdir(/*turbopackIgnore: true*/ actual, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entradas) {
      const ruta = path.join(/*turbopackIgnore: true*/ actual, e.name);
      if (e.isDirectory()) pendientes.push(ruta);
      else if (e.isFile()) {
        archivos++;
        try {
          bytes += (await fs.stat(/*turbopackIgnore: true*/ ruta)).size;
        } catch {
          // archivo borrado mientras se medía
        }
      }
    }
  }
  return { archivos, bytes };
}

/** Archivos que suben las secretarias (fotos, PDFs). */
export async function archivosSubidos() {
  const carpetas = [
    path.join(/*turbopackIgnore: true*/ RAIZ, "public", "uploads"),
    path.join(/*turbopackIgnore: true*/ RAIZ, "public", "images", "uploads"),
  ];
  let archivos = 0;
  let bytes = 0;
  for (const c of carpetas) {
    const m = await medirCarpeta(c);
    archivos += m.archivos;
    bytes += m.bytes;
  }
  return { archivos, bytes };
}

export interface EstadoRespaldos {
  disponible: boolean;
  carpeta: string;
  cantidad: number;
  bytesTotal: number;
  ultimo: { nombre: string; fecha: string; bytes: number } | null;
}

/** Respaldos diarios de la base de datos (los genera /root/backup_sitecorpac.sh). */
export async function estadoRespaldos(): Promise<EstadoRespaldos> {
  const carpeta = process.env.BACKUPS_DIR || "/home/sitecorpac/backups";
  try {
    const nombres = (await fs.readdir(/*turbopackIgnore: true*/ carpeta)).filter((n) => n.endsWith(".sql.gz"));
    const datos = await Promise.all(
      nombres.map(async (nombre) => {
        const st = await fs.stat(path.join(/*turbopackIgnore: true*/ carpeta, nombre));
        return { nombre, fecha: st.mtime.toISOString(), bytes: st.size };
      })
    );
    datos.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return {
      disponible: true,
      carpeta,
      cantidad: datos.length,
      bytesTotal: datos.reduce((s, d) => s + d.bytes, 0),
      ultimo: datos[0] ?? null,
    };
  } catch {
    return { disponible: false, carpeta, cantidad: 0, bytesTotal: 0, ultimo: null };
  }
}

export interface EstadoCertificado {
  dominio: string;
  venceEl: string | null;
  diasRestantes: number | null;
  emisor: string | null;
  error: string | null;
}

/** Fecha de vencimiento del certificado HTTPS que ve un visitante. */
export function estadoCertificado(): Promise<EstadoCertificado> {
  let dominio = "sitecorpac.com";
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (base && base.startsWith("https://")) dominio = new URL(base).hostname;
  } catch {
    // URL mal escrita: se usa el dominio por defecto
  }

  return new Promise((resolve) => {
    const fin = (r: Omit<EstadoCertificado, "dominio">) => resolve({ dominio, ...r });
    const socket = tls.connect(
      { host: dominio, port: 443, servername: dominio, timeout: 5000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          fin({ venceEl: null, diasRestantes: null, emisor: null, error: "Sin certificado" });
          return;
        }
        const vence = new Date(cert.valid_to);
        fin({
          venceEl: vence.toISOString(),
          diasRestantes: Math.floor((vence.getTime() - Date.now()) / 86400000),
          emisor: (cert.issuer?.O as string | undefined) ?? null,
          error: null,
        });
      }
    );
    socket.on("timeout", () => {
      socket.destroy();
      fin({ venceEl: null, diasRestantes: null, emisor: null, error: "Sin respuesta" });
    });
    socket.on("error", (e) =>
      fin({ venceEl: null, diasRestantes: null, emisor: null, error: e.message })
    );
  });
}
