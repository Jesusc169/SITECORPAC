/**
 * Historial de cambios: "fotos" (instantáneas) de una noticia, feria,
 * sorteo o miembro del directorio, tomadas antes y después de cada edición.
 * Se guardan en registro_actividad.antes / .despues (mismo plazo de 180
 * días que el registro) y permiten ver qué cambió y volver los textos a
 * como estaban.
 *
 * Se pueden restaurar los textos, las fechas y el interruptor de
 * visibilidad. Fotos, PDFs, fechas de feria, empresas y premios solo se
 * muestran (no se restauran): sus archivos pueden ya no existir.
 */
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { invalidarCache } from "@/lib/invalidarCache";
import type { ModuloRegistro } from "@/lib/registro";

export type Instantanea = Record<string, string | number | boolean | null | string[]>;

export const MODULOS_CON_HISTORIAL = ["noticias", "ferias", "sorteos", "directorio"] as const;
export type ModuloHistorial = (typeof MODULOS_CON_HISTORIAL)[number];

export function tieneHistorial(modulo: string): modulo is ModuloHistorial {
  return (MODULOS_CON_HISTORIAL as readonly string[]).includes(modulo);
}

/** Campos que «Restaurar versión anterior» devuelve a su valor previo. */
export const CAMPOS_RESTAURABLES: Record<ModuloHistorial, string[]> = {
  noticias: ["titulo", "descripcion", "contenido", "autor", "activo"],
  ferias: ["titulo", "descripcion", "anio", "estado"],
  sorteos: ["nombre", "descripcion", "lugar", "fecha_hora", "anio", "estado"],
  directorio: ["nombre", "cargo", "correo", "telefono", "periodoInicio", "periodoFin"],
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** "2026-03-30 09:00–17:00 · Sede (Lima)" */
function describirFechaFeria(x: { fecha: Date; hora_inicio: string; hora_fin: string; ubicacion: string; zona: string | null }) {
  const zona = x.zona ? " (" + x.zona + ")" : "";
  return `${x.fecha.toISOString().slice(0, 10)} ${x.hora_inicio}–${x.hora_fin} · ${x.ubicacion}${zona}`;
}

/** "TV ×2" (la cantidad solo si es más de 1) */
function describirPremio(p: { nombre: string; cantidad: number | null }) {
  const cantidad = p.cantidad && p.cantidad > 1 ? " ×" + p.cantidad : "";
  return p.nombre + cantidad;
}

export async function instantanea(
  modulo: ModuloRegistro,
  id: number
): Promise<Instantanea | null> {
  try {
    switch (modulo) {
      case "noticias": {
        const n = await prisma.noticia.findUnique({
          where: { id },
          include: {
            noticia_imagen: { orderBy: { orden: "asc" } },
            noticia_pdf: { orderBy: { orden: "asc" } },
          },
        });
        if (!n) return null;
        return {
          titulo: n.titulo,
          descripcion: n.descripcion,
          contenido: n.contenido,
          autor: n.autor,
          activo: n.activo,
          imagen: n.imagen,
          imagenes: n.noticia_imagen.map((i) => i.url),
          documentos: n.noticia_pdf.map((p) => p.nombre),
        };
      }
      case "ferias": {
        const f = await prisma.evento_feria.findUnique({
          where: { id },
          include: {
            evento_feria_imagen: { orderBy: { orden: "asc" } },
            evento_feria_fecha: { orderBy: { fecha: "asc" } },
            evento_feria_empresa: { include: { empresa: { select: { nombre: true } } } },
          },
        });
        if (!f) return null;
        return {
          titulo: f.titulo,
          descripcion: f.descripcion,
          anio: f.anio,
          estado: f.estado ?? true,
          imagen_portada: f.imagen_portada,
          imagenes: f.evento_feria_imagen.map((i) => i.url),
          fechas: f.evento_feria_fecha.map(describirFechaFeria),
          empresas: f.evento_feria_empresa
            .map((e) => e.empresa.nombre)
            .sort((a, b) => a.localeCompare(b, "es")),
        };
      }
      case "sorteos": {
        const s = await prisma.sorteo.findUnique({
          where: { id },
          include: {
            sorteo_imagen: { orderBy: { orden: "asc" } },
            sorteo_producto: { orderBy: { id: "asc" } },
          },
        });
        if (!s) return null;
        return {
          nombre: s.nombre,
          descripcion: s.descripcion,
          lugar: s.lugar,
          fecha_hora: iso(s.fecha_hora),
          anio: s.anio,
          estado: s.estado ?? "ACTIVO",
          imagen: s.imagen,
          imagenes: s.sorteo_imagen.map((i) => i.url),
          premios: s.sorteo_producto.map(describirPremio),
        };
      }
      case "directorio": {
        const m = await prisma.directorio.findUnique({ where: { id } });
        if (!m) return null;
        return {
          nombre: m.nombre,
          cargo: m.cargo,
          correo: m.correo,
          telefono: m.telefono,
          fotoUrl: m.fotoUrl,
          periodoInicio: iso(m.periodoInicio),
          periodoFin: iso(m.periodoFin),
        };
      }
      default:
        return null;
    }
  } catch (e) {
    console.error("No se pudo tomar la instantánea:", e);
    return null;
  }
}

export interface Diferencia {
  campo: string;
  antes: Instantanea[string] | undefined;
  despues: Instantanea[string] | undefined;
  restaurable: boolean;
}

/** Campos que cambiaron entre dos instantáneas. */
export function diferencias(
  modulo: string,
  antes: Instantanea | null,
  despues: Instantanea | null
): Diferencia[] {
  if (!antes || !despues) return [];
  const restaurables = tieneHistorial(modulo) ? CAMPOS_RESTAURABLES[modulo] : [];
  const campos = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)]));
  return campos
    .filter((c) => JSON.stringify(antes[c] ?? null) !== JSON.stringify(despues[c] ?? null))
    .map((c) => ({ campo: c, antes: antes[c], despues: despues[c], restaurable: restaurables.includes(c) }));
}

function texto(v: unknown): string {
  if (typeof v === "string") return v;
  return v == null ? "" : String(v);
}

function fechaONull(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Devuelve los campos restaurables a los valores de `antes`. Lanza si el
 * registro ya no existe (fue eliminado: se recupera desde la Papelera).
 */
export async function restaurarCampos(
  modulo: ModuloHistorial,
  id: number,
  antes: Instantanea
): Promise<void> {
  switch (modulo) {
    case "noticias":
      await prisma.noticia.update({
        where: { id },
        data: {
          titulo: texto(antes.titulo),
          descripcion: texto(antes.descripcion),
          contenido: antes.contenido == null ? null : texto(antes.contenido),
          autor: texto(antes.autor),
          activo: antes.activo !== false,
          updatedAt: new Date(),
        },
      });
      invalidarCache("noticias");
      return;
    case "ferias":
      await prisma.evento_feria.update({
        where: { id },
        data: {
          titulo: texto(antes.titulo),
          descripcion: texto(antes.descripcion),
          anio: Number(antes.anio),
          estado: antes.estado !== false,
        },
      });
      invalidarCache("ferias");
      return;
    case "sorteos": {
      const fecha = fechaONull(antes.fecha_hora);
      const data: Prisma.sorteoUpdateInput = {
        nombre: texto(antes.nombre),
        descripcion: texto(antes.descripcion),
        lugar: texto(antes.lugar),
        anio: Number(antes.anio),
        estado: antes.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
        actualizado_en: new Date(),
      };
      if (fecha) data.fecha_hora = fecha;
      await prisma.sorteo.update({ where: { id }, data });
      invalidarCache("sorteos");
      return;
    }
    case "directorio": {
      const inicio = fechaONull(antes.periodoInicio);
      const data: Prisma.directorioUpdateInput = {
        nombre: texto(antes.nombre),
        cargo: texto(antes.cargo),
        correo: texto(antes.correo),
        telefono: texto(antes.telefono),
        periodoFin: fechaONull(antes.periodoFin),
      };
      if (inicio) data.periodoInicio = inicio;
      await prisma.directorio.update({ where: { id }, data });
      invalidarCache("directorio");
      return;
    }
  }
}
