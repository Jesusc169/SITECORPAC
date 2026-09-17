import { unstable_cache, revalidateTag } from "next/cache";
import { SorteoModel } from "@/models/sorteoModel";
import { guardarImagenSorteo, borrarImagenSorteo } from "@/lib/archivosSorteo";
import { resolverGaleria, MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";
import { MAX_IMAGEN_BYTES } from "@/lib/archivosNoticia";

export class SorteoValidationError extends Error {}

type Estado = "ACTIVO" | "INACTIVO";

interface Premio {
  nombre: string;
  descripcion: string;
  cantidad: number;
}

interface DatosSorteo {
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

function normalizarPremios(premios: any[]): Premio[] {
  return (premios || []).map((p) => ({
    nombre: p.nombre || "",
    descripcion: p.descripcion || "",
    cantidad: Number(p.cantidad) || 1,
  }));
}

function fechaValida(fecha: Date): Date {
  return isNaN(fecha.getTime()) ? new Date() : fecha;
}

// Lectura pública cacheada 60s, con tag "sorteos" para invalidarla al
// instante desde crear/editar/duplicar/eliminar (revalidateTag más abajo).
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
      lugar: input.lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: fechaValida(input.fecha_hora),
      imagen,
      premios: normalizarPremios(input.premios),
      imagenes: imagenesData,
    });

    revalidateTag("sorteos", "max");
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
    const sorteoActual = await SorteoModel.obtenerPorId(id);
    if (!sorteoActual) return null;

    const imagenesNuevasValidas = input.imagenesNuevas.filter((f) => f && f.size > 0);
    const existentes = sorteoActual.sorteo_imagen.map((img) => ({ id: img.id, orden: img.orden }));
    const idsEliminar = input.imagenesEliminar.filter((eid) => existentes.some((e) => e.id === eid));

    const activasActuales = existentes.length - idsEliminar.length;
    if (activasActuales + imagenesNuevasValidas.length > MAX_IMAGENES_GALERIA) {
      throw new SorteoValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por sorteo`);
    }
    for (const file of imagenesNuevasValidas) {
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new SorteoValidationError("Cada imagen debe ser menor a 10MB");
      }
    }

    const plan = resolverGaleria({
      existentes,
      idsEliminar,
      cantidadNuevas: imagenesNuevasValidas.length,
      principalExistenteId: input.imagenPrincipalId,
      principalNuevaIndex: input.imagenPrincipalNuevaIndex,
    });

    for (const eid of idsEliminar) {
      const img = sorteoActual.sorteo_imagen.find((i) => i.id === eid);
      if (img) await borrarImagenSorteo(img.url);
    }
    if (idsEliminar.length > 0) {
      await SorteoModel.eliminarImagenes(idsEliminar);
    }

    for (const sup of plan.supervivientes) {
      const original = existentes.find((e) => e.id === sup.id);
      if (original && original.orden !== sup.orden) {
        await SorteoModel.reordenarImagen(sup.id, sup.orden);
      }
    }

    const nuevasCreadas: { id: number; url: string }[] = [];
    for (let i = 0; i < imagenesNuevasValidas.length; i++) {
      const url = await guardarImagenSorteo(imagenesNuevasValidas[i], i);
      const creada = await SorteoModel.crearImagen({
        sorteo_id: id,
        url,
        orden: plan.nuevas[i].orden,
        principal: false,
      });
      nuevasCreadas.push({ id: creada.id, url });
    }

    const principal = plan.principal;
    let imagen: string | null = null;
    if (principal?.tipo === "existente") {
      await SorteoModel.marcarImagenPrincipal(id, principal.id);
      imagen = sorteoActual.sorteo_imagen.find((i) => i.id === principal.id)?.url ?? null;
    } else if (principal?.tipo === "nueva") {
      const fila = nuevasCreadas[principal.indice];
      if (fila) {
        await SorteoModel.marcarImagenPrincipal(id, fila.id);
        imagen = fila.url;
      }
    }

    const sorteo = await SorteoModel.actualizar(id, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      lugar: input.lugar,
      anio: input.anio,
      estado: input.estado,
      fecha_hora: input.fecha_hora,
      premios: normalizarPremios(input.premios),
      imagen,
    });

    revalidateTag("sorteos", "max");
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

    revalidateTag("sorteos", "max");
    return nuevo;
  },

  eliminarSorteo: async (id: number) => {
    const sorteo = await SorteoModel.obtenerPorId(id);
    if (sorteo) {
      await borrarImagenSorteo(sorteo.imagen);
      for (const img of sorteo.sorteo_imagen) {
        await borrarImagenSorteo(img.url);
      }
    }

    await SorteoModel.eliminar(id);
    revalidateTag("sorteos", "max");
  },
};
