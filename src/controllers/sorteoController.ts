import { unstable_cache } from "next/cache";
import { invalidarCache } from "@/lib/invalidarCache";
import { SorteoModel } from "@/models/sorteoModel";
import { guardarImagenSorteo, borrarImagenSorteo } from "@/lib/archivosSorteo";
import { MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";
import { actualizarGaleria } from "@/lib/galeria";
import { MAX_IMAGEN_BYTES } from "@/lib/archivosNoticia";
import { moverAPapelera } from "@/lib/papelera";
import type { ActorRegistro } from "@/lib/registro";

export class SorteoValidationError extends Error {}

/** La columna sorteo.lugar es VARCHAR(150) y el lugar es obligatorio. */
const MAX_LUGAR = 150;
function normalizarLugar(lugar: string): string {
  const limpio = lugar.trim();
  if (!limpio) throw new SorteoValidationError("Indica el lugar del sorteo");
  if (limpio.length > MAX_LUGAR) {
    throw new SorteoValidationError(`El lugar no puede superar ${MAX_LUGAR} caracteres`);
  }
  return limpio;
}

type Estado = "ACTIVO" | "INACTIVO";

export interface Premio {
  nombre: string;
  descripcion: string;
  cantidad: number;
}

export interface DatosSorteo {
  nombre: string;
  descripcion: string;
  lugar: string;
  anio: number;
  estado: Estado;
  fecha_hora: Date;
  premios: Premio[];
  imagenFiles: File[];
  imagenPrincipalIndex: number;
  imagenUrl: string | null;
}

function normalizarPremios(premios: unknown): Premio[] {
  const lista: Partial<Premio>[] = Array.isArray(premios) ? premios : [];
  return lista.map((p) => ({
    nombre: p.nombre ?? "",
    descripcion: p.descripcion ?? "",
    // 0, vacío o texto → 1
    cantidad: Number(p.cantidad) || 1,
  }));
}

function fechaValida(fecha: Date): Date {
  return isNaN(fecha.getTime()) ? new Date() : fecha;
}

// Lectura pública cacheada 60s, con tag "sorteos" para invalidarla al
// instante desde crear/editar/duplicar/eliminar (invalidarCache más abajo).
const obtenerSorteosPublicosCacheados = unstable_cache(
  async (anio: number | null) => SorteoModel.obtenerActivos(anio),
  ["sorteos-publicos"],
  { revalidate: 60, tags: ["sorteos"] }
);

export const SorteoController = {
  obtenerSorteosPublicos: (anioParam: string | null) => {
    const anio = anioParam && /^\d{4}$/.test(anioParam) ? Number(anioParam) : null;
    return obtenerSorteosPublicosCacheados(anio);
  },

  obtenerSorteosAdmin: () => SorteoModel.obtenerTodos(),

  obtenerSorteoPorId: (id: number) => SorteoModel.obtenerPorId(id),

  crearSorteo: async (input: DatosSorteo) => {
    const lugar = normalizarLugar(input.lugar);
    const imagenesValidas = input.imagenFiles.filter((f) => f && f.size > 0);
    if (imagenesValidas.length > MAX_IMAGENES_GALERIA) {
      throw new SorteoValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por sorteo`);
    }
    for (const file of imagenesValidas) {
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new SorteoValidationError("Cada imagen debe ser menor a 10MB");
      }
    }

    const principalIndex = Math.min(
      Math.max(0, input.imagenPrincipalIndex || 0),
      Math.max(0, imagenesValidas.length - 1)
    );

    const imagenesData: { url: string; orden: number; principal: boolean }[] = [];
    for (let i = 0; i < imagenesValidas.length; i++) {
      const url = await guardarImagenSorteo(imagenesValidas[i], i);
      imagenesData.push({ url, orden: i + 1, principal: i === principalIndex });
    }

    // Si no llegó ninguna foto por multipart, se respeta la URL directa (uso
    // desde el flujo JSON, ver POST /api/administrador/sorteos).
    const imagen = imagenesData[principalIndex]?.url ?? input.imagenUrl ?? null;
    if (imagenesData.length === 0 && input.imagenUrl) {
      imagenesData.push({ url: input.imagenUrl, orden: 1, principal: true });
    }

    const sorteo = await SorteoModel.crear({
      nombre: input.nombre,
      descripcion: input.descripcion,
      lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: fechaValida(input.fecha_hora),
      imagen,
      premios: normalizarPremios(input.premios),
      imagenes: imagenesData,
    });

    invalidarCache("sorteos");
    return sorteo;
  },

  actualizarSorteo: async (
    id: number,
    input: {
      nombre: string;
      descripcion: string;
      lugar: string;
      anio: number;
      estado: Estado;
      fecha_hora: Date;
      premios: Premio[];
      imagenesNuevas: File[];
      imagenesEliminar: number[];
      imagenPrincipalId: number | null;
      imagenPrincipalNuevaIndex: number | null;
    }
  ) => {
    const lugar = normalizarLugar(input.lugar);
    const sorteoActual = await SorteoModel.obtenerPorId(id);
    if (!sorteoActual) return null;

    const imagen = await actualizarGaleria(
      {
        existentes: sorteoActual.sorteo_imagen,
        imagenesNuevas: input.imagenesNuevas,
        imagenesEliminar: input.imagenesEliminar,
        imagenPrincipalId: input.imagenPrincipalId,
        imagenPrincipalNuevaIndex: input.imagenPrincipalNuevaIndex,
      },
      {
        etiqueta: "sorteo",
        error: (m) => new SorteoValidationError(m),
        // el tipo de archivo lo valida guardarImagenSorteo
        validarArchivo: (file) => {
          if (file.size > MAX_IMAGEN_BYTES) throw new SorteoValidationError("Cada imagen debe ser menor a 10MB");
        },
        borrarArchivo: borrarImagenSorteo,
        guardarArchivo: guardarImagenSorteo,
        eliminarImagenes: SorteoModel.eliminarImagenes,
        reordenarImagen: SorteoModel.reordenarImagen,
        crearImagen: (url, orden) => SorteoModel.crearImagen({ sorteo_id: id, url, orden, principal: false }),
        marcarPrincipal: (idImagen) => SorteoModel.marcarImagenPrincipal(id, idImagen),
      }
    );

    const sorteo = await SorteoModel.actualizar(id, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: input.fecha_hora,
      premios: normalizarPremios(input.premios),
      imagen,
    });

    invalidarCache("sorteos");
    return sorteo;
  },

  duplicarSorteo: async (id: number) => {
    const original = await SorteoModel.obtenerPorId(id);
    if (!original) return null;

    const nuevo = await SorteoModel.crear({
      nombre: original.nombre + " (Copia)",
      descripcion: original.descripcion,
      lugar: original.lugar,
      anio: original.anio,
      estado: "ACTIVO",
      fecha_hora: original.fecha_hora,
      imagen: original.imagen,
      premios: original.sorteo_producto.map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        cantidad: p.cantidad ?? 1,
      })),
    });

    invalidarCache("sorteos");
    return nuevo;
  },

  // Va a la papelera (30 días, se puede restaurar). Ver lib/papelera.ts.
  eliminarSorteo: async (id: number, actor?: ActorRegistro | null) => {
    const nombre = await moverAPapelera("sorteos", id, actor);
    invalidarCache("sorteos");
    return nombre;
  },
};
