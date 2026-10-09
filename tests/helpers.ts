/**
 * Ayudantes de los tests de integración (base de datos de prueba real).
 */
import bcrypt from "bcryptjs";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { firmarTokenSesion } from "@/lib/auth";
import { cookiesDePrueba } from "./setup";

/** Vacía todas las tablas de la base de PRUEBA. */
export async function limpiarBD() {
  const [{ base }] = await prisma.$queryRaw<{ base: string }[]>`SELECT DATABASE() AS base`;
  if (!base.endsWith("_test")) throw new Error(`limpiarBD() solo corre en una base *_test (es ${base})`);
  const tablas = await prisma.$queryRaw<{ t: string }[]>`
    SELECT table_name AS t FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`;
  // En una transacción: SET FOREIGN_KEY_CHECKS vale solo para UNA conexión,
  // y fuera de una transacción Prisma reparte las consultas entre varias.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    for (const { t } of tablas) {
      // DELETE y no TRUNCATE: en tablas casi vacías es decenas de veces más rápido
      if (t !== "_prisma_migrations") await tx.$executeRawUnsafe(`DELETE FROM \`${t}\``);
    }
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  });
  cookiesDePrueba.clear();
}

export const CLAVE = "Clave-de-prueba-123";
let hashClave: string | null = null;

export async function crearUsuario(datos: {
  nombre?: string;
  email?: string;
  rol?: "administrador" | "secretaria";
  permisos?: string[];
  activo?: boolean;
} = {}) {
  hashClave ??= await bcrypt.hash(CLAVE, 4);
  const n = Math.random().toString(36).slice(2, 8);
  return prisma.user.create({
    data: {
      nombre: datos.nombre ?? `Usuario ${n}`,
      email: datos.email ?? `u${n}@test.local`,
      password: hashClave,
      rol: datos.rol ?? "secretaria",
      permisos: datos.permisos ?? [],
      activo: datos.activo ?? true,
    },
  });
}

export const crearAdmin = (nombre = "Admin Prueba") => crearUsuario({ nombre, rol: "administrador" });

/** Deja la cookie de sesión de ese usuario para las siguientes llamadas. */
export function iniciarSesionComo(u: { id: number; email: string; rol: string; sesionVersion: number }) {
  cookiesDePrueba.set("token", firmarTokenSesion(u));
}

export function cerrarSesion() {
  cookiesDePrueba.delete("token");
}

export function ponerCookie(valor: string) {
  cookiesDePrueba.set("token", valor);
}

type Cuerpo = { json?: unknown; form?: Record<string, string | File | (string | File)[]> };

/** Arma un Request como el que recibe una ruta de la API. */
export function peticion(
  ruta: string,
  metodo = "GET",
  cuerpo: Cuerpo = {},
  ip = "10.0.0.1"
): Request {
  const headers: Record<string, string> = { "x-real-ip": ip };
  let body: BodyInit | undefined;
  if (cuerpo.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(cuerpo.json);
  } else if (cuerpo.form) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(cuerpo.form)) {
      for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
    }
    body = fd;
  }
  return new Request(`http://localhost${ruta}`, { method: metodo, headers, body });
}

/** `params` como lo pasa Next a una ruta dinámica. */
export const params = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });

/** Imagen PNG de verdad (sharp la puede procesar). */
export async function imagenPng(nombre = "foto.png", ancho = 20): Promise<File> {
  const buf = await sharp({
    create: { width: ancho, height: 10, channels: 3, background: { r: 200, g: 30, b: 30 } },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(buf)], nombre, { type: "image/png" });
}

export function archivo(nombre: string, tipo: string, contenido = "contenido"): File {
  return new File([contenido], nombre, { type: tipo });
}

export async function json(res: Response) {
  return res.json();
}

export { prisma };
