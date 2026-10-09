/**
 * Papelera: eliminar en el panel ya no borra al instante.
 *
 * Al eliminar una noticia, feria, sorteo o miembro del directorio se guarda
 * el registro completo (con fotos, PDFs, fechas, empresas y premios) en la
 * tabla `papelera` y recién entonces se borra de su tabla, todo en una sola
 * transacción. Durante 30 días se puede restaurar con el mismo id (los
 * enlaces vuelven a funcionar). Los archivos NO se tocan al eliminar: se
 * borran recién al vencer, y solo si ningún otro registro los usa (una feria
 * duplicada comparte las imágenes de la original).
 */
import path from "path";
import { unlink } from "fs/promises";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { invalidarCache } from "@/lib/invalidarCache";
import type { ActorRegistro } from "@/lib/registro";

export const DIAS_PAPELERA = 30;
export const MODULOS_PAPELERA = ["noticias", "ferias", "sorteos", "directorio"] as const;
export type ModuloPapelera = (typeof MODULOS_PAPELERA)[number];

export class PapeleraError extends Error {}

const DIA_MS = 24 * 60 * 60 * 1000;

/* ---------------- lectura completa de cada tipo ---------------- */
async function leerCompleto(modulo: ModuloPapelera, id: number) {
  switch (modulo) {
    case "noticias": {
      const n = await prisma.noticia.findUnique({
        where: { id },
        include: { noticia_imagen: true, noticia_pdf: true },
      });
      if (!n) return null;
      return {
        titulo: n.titulo,
        datos: n,
        archivos: [n.imagen, ...n.noticia_imagen.map((i) => i.url), ...n.noticia_pdf.map((p) => p.url)],
      };
    }
    case "ferias": {
      const f = await prisma.evento_feria.findUnique({
        where: { id },
        include: { evento_feria_imagen: true, evento_feria_fecha: true, evento_feria_empresa: true },
      });
      if (!f) return null;
      return {
        titulo: f.titulo,
        datos: f,
        archivos: [f.imagen_portada, ...f.evento_feria_imagen.map((i) => i.url)],
      };
    }
    case "sorteos": {
      const s = await prisma.sorteo.findUnique({
        where: { id },
        include: { sorteo_imagen: true, sorteo_producto: true },
      });
      if (!s) return null;
      return {
        titulo: s.nombre,
        datos: s,
        archivos: [s.imagen, ...s.sorteo_imagen.map((i) => i.url)],
      };
    }
    case "directorio": {
      const m = await prisma.directorio.findUnique({ where: { id } });
      if (!m) return null;
      return { titulo: `${m.nombre} (${m.cargo})`, datos: m, archivos: [m.fotoUrl] };
    }
  }
}

function borrarDeSuTabla(tx: Prisma.TransactionClient, modulo: ModuloPapelera, id: number) {
  // Las tablas hijas (imágenes, pdfs, fechas, empresas, premios) tienen
  // ON DELETE CASCADE: se van con el registro principal.
  switch (modulo) {
    case "noticias":
      return tx.noticia.delete({ where: { id } });
    case "ferias":
      return tx.evento_feria.delete({ where: { id } });
    case "sorteos":
      return tx.sorteo.delete({ where: { id } });
    case "directorio":
      return tx.directorio.delete({ where: { id } });
  }
}

/**
 * Guarda el registro en la papelera y lo borra de su tabla.
 * Devuelve el título, o null si no existía.
 */
export async function moverAPapelera(
  modulo: ModuloPapelera,
  id: number,
  actor?: ActorRegistro | null
): Promise<string | null> {
  const completo = await leerCompleto(modulo, id);
  if (!completo) return null;

  const archivos = Array.from(new Set(completo.archivos.filter((a): a is string => !!a)));
  await prisma.$transaction(async (tx) => {
    await tx.papelera.create({
      data: {
        modulo,
        entidadId: id,
        titulo: completo.titulo.slice(0, 255),
        // JSON: las fechas quedan como texto ISO y se convierten al restaurar
        datos: JSON.parse(JSON.stringify(completo.datos)),
        archivos,
        eliminadoPorId: actor?.id ?? null,
        eliminadoPor: actor?.nombre?.slice(0, 120) ?? null,
        expiraEn: new Date(Date.now() + DIAS_PAPELERA * DIA_MS),
      },
    });
    await borrarDeSuTabla(tx, modulo, id);
  });
  return completo.titulo;
}

/* ---------------- restaurar ---------------- */
type Fila = Record<string, unknown>;
const fecha = (v: unknown): Date => new Date(v as string);
const fechaONull = (v: unknown): Date | null => (v ? new Date(v as string) : null);
const lista = (v: unknown): Fila[] => (Array.isArray(v) ? (v as Fila[]) : []);

async function yaExiste(modulo: ModuloPapelera, id: number): Promise<boolean> {
  switch (modulo) {
    case "noticias":
      return !!(await prisma.noticia.findUnique({ where: { id }, select: { id: true } }));
    case "ferias":
      return !!(await prisma.evento_feria.findUnique({ where: { id }, select: { id: true } }));
    case "sorteos":
      return !!(await prisma.sorteo.findUnique({ where: { id }, select: { id: true } }));
    case "directorio":
      return !!(await prisma.directorio.findUnique({ where: { id }, select: { id: true } }));
  }
}

async function recrear(tx: Prisma.TransactionClient, modulo: ModuloPapelera, d: Fila) {
  switch (modulo) {
    case "noticias":
      await tx.noticia.create({
        data: {
          id: d.id as number,
          titulo: d.titulo as string,
          descripcion: d.descripcion as string,
          contenido: (d.contenido as string | null) ?? null,
          imagen: (d.imagen as string | null) ?? null,
          fecha: fecha(d.fecha),
          createdAt: fecha(d.createdAt),
          updatedAt: new Date(),
          autor: d.autor as string,
          activo: d.activo !== false,
          noticia_imagen: {
            create: lista(d.noticia_imagen).map((i) => ({
              id: i.id as number,
              url: i.url as string,
              orden: i.orden as number,
              principal: !!i.principal,
            })),
          },
          noticia_pdf: {
            create: lista(d.noticia_pdf).map((p) => ({
              id: p.id as number,
              url: p.url as string,
              nombre: p.nombre as string,
              orden: (p.orden as number | null) ?? 1,
            })),
          },
        },
      });
      return;
    case "ferias": {
      // Si una empresa se borró mientras tanto, la feria vuelve sin ella.
      const ids = lista(d.evento_feria_empresa).map((e) => e.empresa_id as number);
      const existentes = new Set(
        (await tx.empresa.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((e) => e.id)
      );
      await tx.evento_feria.create({
        data: {
          id: d.id as number,
          titulo: d.titulo as string,
          descripcion: d.descripcion as string,
          anio: d.anio as number,
          imagen_portada: (d.imagen_portada as string | null) ?? null,
          estado: d.estado !== false,
          created_at: fechaONull(d.created_at),
          evento_feria_imagen: {
            create: lista(d.evento_feria_imagen).map((i) => ({
              id: i.id as number,
              url: i.url as string,
              orden: i.orden as number,
              principal: !!i.principal,
            })),
          },
          evento_feria_fecha: {
            create: lista(d.evento_feria_fecha).map((f) => ({
              id: f.id as number,
              fecha: fecha(f.fecha),
              hora_inicio: f.hora_inicio as string,
              hora_fin: f.hora_fin as string,
              ubicacion: f.ubicacion as string,
              zona: (f.zona as string | null) ?? null,
            })),
          },
          evento_feria_empresa: {
            create: lista(d.evento_feria_empresa)
              .filter((e) => existentes.has(e.empresa_id as number))
              // forma directa (id + empresa_id): con `empresa: { connect }` Prisma no acepta el id
              .map((e) => ({ id: e.id as number, empresa_id: e.empresa_id as number })),
          },
        },
      });
      return;
    }
    case "sorteos":
      await tx.sorteo.create({
        data: {
          id: d.id as number,
          nombre: d.nombre as string,
          descripcion: d.descripcion as string,
          imagen: (d.imagen as string | null) ?? null,
          lugar: d.lugar as string,
          fecha_hora: fecha(d.fecha_hora),
          anio: d.anio as number,
          estado: d.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
          creado_en: fechaONull(d.creado_en),
          actualizado_en: new Date(),
          sorteo_imagen: {
            create: lista(d.sorteo_imagen).map((i) => ({
              id: i.id as number,
              url: i.url as string,
              orden: i.orden as number,
              principal: !!i.principal,
            })),
          },
          sorteo_producto: {
            create: lista(d.sorteo_producto).map((p) => ({
              id: p.id as number,
              nombre: p.nombre as string,
              descripcion: (p.descripcion as string | null) ?? null,
              cantidad: (p.cantidad as number | null) ?? 1,
            })),
          },
        },
      });
      return;
    case "directorio":
      await tx.directorio.create({
        data: {
          id: d.id as number,
          nombre: d.nombre as string,
          cargo: d.cargo as string,
          correo: d.correo as string,
          telefono: d.telefono as string,
          fotoUrl: (d.fotoUrl as string | null) ?? null,
          periodoInicio: fecha(d.periodoInicio),
          periodoFin: fechaONull(d.periodoFin),
          createdAt: fecha(d.createdAt),
          orden: d.orden as number,
        },
      });
      return;
  }
}

export function esModuloPapelera(m: string): m is ModuloPapelera {
  return (MODULOS_PAPELERA as readonly string[]).includes(m);
}

/** Vuelve a crear el registro con su mismo id y lo saca de la papelera. */
export async function restaurarDePapelera(papeleraId: number) {
  const fila = await prisma.papelera.findUnique({ where: { id: papeleraId } });
  if (!fila) throw new PapeleraError("Ese elemento ya no está en la papelera");
  if (!esModuloPapelera(fila.modulo)) throw new PapeleraError("Tipo de elemento desconocido");
  if (await yaExiste(fila.modulo, fila.entidadId)) {
    throw new PapeleraError("Ya existe un elemento con ese mismo número; no se puede restaurar encima");
  }

  await prisma.$transaction(async (tx) => {
    await recrear(tx, fila.modulo as ModuloPapelera, fila.datos as Fila);
    await tx.papelera.delete({ where: { id: papeleraId } });
  });
  invalidarCache(fila.modulo);
  return fila;
}

/* ---------------- borrado definitivo ---------------- */
const RUTA_SEGURA = /^\/(images\/)?uploads\/[^\0]+$/;

/** Archivos que siguen en uso por algún registro vivo o por otra entrada de la papelera. */
async function archivosEnUso(candidatos: string[], excluirPapeleraId: number): Promise<Set<string>> {
  if (!candidatos.length) return new Set();
  const en = { in: candidatos };
  const [n, ni, np, f, fi, s, si, d, otros] = await Promise.all([
    prisma.noticia.findMany({ where: { imagen: en }, select: { imagen: true } }),
    prisma.noticia_imagen.findMany({ where: { url: en }, select: { url: true } }),
    prisma.noticia_pdf.findMany({ where: { url: en }, select: { url: true } }),
    prisma.evento_feria.findMany({ where: { imagen_portada: en }, select: { imagen_portada: true } }),
    prisma.evento_feria_imagen.findMany({ where: { url: en }, select: { url: true } }),
    prisma.sorteo.findMany({ where: { imagen: en }, select: { imagen: true } }),
    prisma.sorteo_imagen.findMany({ where: { url: en }, select: { url: true } }),
    prisma.directorio.findMany({ where: { fotoUrl: en }, select: { fotoUrl: true } }),
    prisma.papelera.findMany({ where: { id: { not: excluirPapeleraId } }, select: { archivos: true } }),
  ]);
  const usados = new Set<string>();
  const add = (v: string | null | undefined) => v && usados.add(v);
  n.forEach((x) => add(x.imagen));
  ni.forEach((x) => add(x.url));
  np.forEach((x) => add(x.url));
  f.forEach((x) => add(x.imagen_portada));
  fi.forEach((x) => add(x.url));
  s.forEach((x) => add(x.imagen));
  si.forEach((x) => add(x.url));
  d.forEach((x) => add(x.fotoUrl));
  otros.forEach((o) => (Array.isArray(o.archivos) ? (o.archivos as string[]) : []).forEach(add));
  return usados;
}

export function rutaArchivoSegura(url: string): string | null {
  if (!RUTA_SEGURA.test(url) || url.includes("..") || url.includes("\\")) return null;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", url);
}

/** Borra la entrada y los archivos que ya nadie usa. Devuelve cuántos archivos borró. */
export async function eliminarDefinitivamente(papeleraId: number): Promise<{ fila: { modulo: string; titulo: string; entidadId: number }; archivosBorrados: number }> {
  const fila = await prisma.papelera.findUnique({ where: { id: papeleraId } });
  if (!fila) throw new PapeleraError("Ese elemento ya no está en la papelera");

  const archivos = Array.isArray(fila.archivos) ? (fila.archivos as string[]) : [];
  const enUso = await archivosEnUso(archivos, fila.id);
  let archivosBorrados = 0;
  for (const url of archivos) {
    if (enUso.has(url)) continue;
    const ruta = rutaArchivoSegura(url);
    if (!ruta) continue;
    try {
      await unlink(ruta);
      archivosBorrados++;
    } catch {
      // ya no existía
    }
  }
  await prisma.papelera.delete({ where: { id: papeleraId } });
  return { fila: { modulo: fila.modulo, titulo: fila.titulo, entidadId: fila.entidadId }, archivosBorrados };
}

/** Vacía lo que ya cumplió los 30 días. Si una entrada falla, sigue con las demás. */
export async function depurarPapelera(
  borrar: (id: number) => Promise<unknown> = eliminarDefinitivamente
): Promise<number> {
  const vencidos = await prisma.papelera.findMany({
    where: { expiraEn: { lt: new Date() } },
    select: { id: true },
  });
  for (const v of vencidos) {
    await borrar(v.id).catch((e) =>
      console.error("No se pudo depurar la papelera:", e)
    );
  }
  return vencidos.length;
}

export async function listarPapelera() {
  const filas = await prisma.papelera.findMany({
    orderBy: { eliminadoEn: "desc" },
    select: {
      id: true,
      modulo: true,
      entidadId: true,
      titulo: true,
      eliminadoEn: true,
      eliminadoPor: true,
      expiraEn: true,
      archivos: true,
    },
  });
  return filas.map((f) => ({
    ...f,
    eliminadoEn: f.eliminadoEn.toISOString(),
    expiraEn: f.expiraEn.toISOString(),
    archivos: Array.isArray(f.archivos) ? f.archivos.length : 0,
  }));
}
