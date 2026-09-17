import { unstable_cache, revalidateTag } from "next/cache";
import { FeriaModel } from "@/models/feriaModel";
import { guardarImagenFeria, borrarImagenFeria } from "@/lib/archivosFeria";
import { resolverGaleria, MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";
import { MAX_IMAGEN_BYTES } from "@/lib/archivosNoticia";

export class FeriaValidationError extends Error {}

interface FechaInput {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string | null;
}

function normalizarFechas(fechas: FechaInput[]) {
  return fechas.map((f) => ({
    fecha: new Date(f.fecha),
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
    ubicacion: f.ubicacion,
    zona: f.zona || null,
  }));
}

// Lectura pública cacheada 60s, con tag "ferias" para invalidarla al
// instante desde crear/editar/duplicar/eliminar (revalidateTag más abajo).
const obtenerFeriasPublicasCacheadas = unstable_cache(
  async (anio: number | null, skip: number, take: number) =>
    FeriaModel.obtenerPublicas({ anio, skip, take }),
  ["ferias-publicas"],
  { revalidate: 60, tags: ["ferias"] }
);

export const FeriaController = {
  obtenerFeriasAdmin: () => FeriaModel.obtenerTodas(),

  obtenerFeriasPublicas: async (opciones: { anioParam: string | null; pageParam: string | null }) => {
    const page = Number(opciones.pageParam || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    let anio: number | null = null;
    if (opciones.anioParam && /^\d{4}$/.test(opciones.anioParam)) {
      anio = Number(opciones.anioParam);
    }

    return obtenerFeriasPublicasCacheadas(anio, skip, limit);
  },

  obtenerFeriaPorId: (id: number) => FeriaModel.obtenerPorId(id),

  crearFeria: async (input: {
    titulo?: string;
    descripcion?: string;
    anio: number;
    imagenFiles: File[];
    imagenPrincipalIndex: number;
    empresas: number[];
    fechas: FechaInput[];
  }) => {
    const titulo = input.titulo?.trim();
    const descripcion = input.descripcion?.trim();

    if (!titulo || !descripcion || !input.anio) {
      throw new FeriaValidationError("Datos incompletos");
    }

    const imagenesValidas = input.imagenFiles.filter((f) => f && f.size > 0);
    if (imagenesValidas.length > MAX_IMAGENES_GALERIA) {
      throw new FeriaValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por feria`);
    }
    for (const file of imagenesValidas) {
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new FeriaValidationError("Cada imagen debe ser menor a 10MB");
      }
    }

    const principalIndex = Math.min(
      Math.max(0, input.imagenPrincipalIndex || 0),
      Math.max(0, imagenesValidas.length - 1)
    );

    const imagenesData: { url: string; orden: number; principal: boolean }[] = [];
    for (let i = 0; i < imagenesValidas.length; i++) {
      const url = await guardarImagenFeria(imagenesValidas[i], i);
      imagenesData.push({ url, orden: i + 1, principal: i === principalIndex });
    }

    const imagen_portada = imagenesData[principalIndex]?.url ?? null;

    const feria = await FeriaModel.crear({
      titulo,
      descripcion,
      anio: input.anio,
      imagen_portada,
      fechas: normalizarFechas(input.fechas),
      empresas: input.empresas,
      imagenes: imagenesData,
    });

    revalidateTag("ferias", "max");
    return feria;
  },

  actualizarFeria: async (
    id: number,
    input: {
      titulo: string;
      descripcion: string;
      imagenesNuevas: File[];
      imagenesEliminar: number[];
      imagenPrincipalId: number | null;
      imagenPrincipalNuevaIndex: number | null;
      empresas: number[];
      fechas: FechaInput[];
    }
  ) => {
    const feriaActual = await FeriaModel.obtenerPorId(id);
    if (!feriaActual) return null;

    const imagenesNuevasValidas = input.imagenesNuevas.filter((f) => f && f.size > 0);
    const existentes = feriaActual.evento_feria_imagen.map((img) => ({ id: img.id, orden: img.orden }));
    const idsEliminar = input.imagenesEliminar.filter((eid) => existentes.some((e) => e.id === eid));

    const activasActuales = existentes.length - idsEliminar.length;
    if (activasActuales + imagenesNuevasValidas.length > MAX_IMAGENES_GALERIA) {
      throw new FeriaValidationError(`Máximo ${MAX_IMAGENES_GALERIA} fotos por feria`);
    }
    for (const file of imagenesNuevasValidas) {
      if (file.size > MAX_IMAGEN_BYTES) {
        throw new FeriaValidationError("Cada imagen debe ser menor a 10MB");
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
      const img = feriaActual.evento_feria_imagen.find((i) => i.id === eid);
      if (img) await borrarImagenFeria(img.url);
    }
    if (idsEliminar.length > 0) {
      await FeriaModel.eliminarImagenes(idsEliminar);
    }

    for (const sup of plan.supervivientes) {
      const original = existentes.find((e) => e.id === sup.id);
      if (original && original.orden !== sup.orden) {
        await FeriaModel.reordenarImagen(sup.id, sup.orden);
      }
    }

    const nuevasCreadas: { id: number; url: string }[] = [];
    for (let i = 0; i < imagenesNuevasValidas.length; i++) {
      const url = await guardarImagenFeria(imagenesNuevasValidas[i], i);
      const creada = await FeriaModel.crearImagen({
        feria_id: id,
        url,
        orden: plan.nuevas[i].orden,
        principal: false,
      });
      nuevasCreadas.push({ id: creada.id, url });
    }

    const principal = plan.principal;
    let imagen_portada: string | null = null;
    if (principal?.tipo === "existente") {
      await FeriaModel.marcarImagenPrincipal(id, principal.id);
      imagen_portada =
        feriaActual.evento_feria_imagen.find((i) => i.id === principal.id)?.url ?? null;
    } else if (principal?.tipo === "nueva") {
      const fila = nuevasCreadas[principal.indice];
      if (fila) {
        await FeriaModel.marcarImagenPrincipal(id, fila.id);
        imagen_portada = fila.url;
      }
    }

    await FeriaModel.actualizar(id, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      imagen_portada,
    });

    await FeriaModel.reemplazarEmpresas(id, input.empresas);
    await FeriaModel.reemplazarFechas(id, normalizarFechas(input.fechas));

    const feria = await FeriaModel.obtenerPorId(id);
    revalidateTag("ferias", "max");
    return feria;
  },

  duplicarFeria: async (id: number) => {
    const original = await FeriaModel.obtenerPorId(id);
    if (!original) return null;

    const nuevaFeria = await FeriaModel.crear({
      titulo: original.titulo + " (Copia)",
      descripcion: original.descripcion ?? "",
      anio: new Date().getFullYear(),
      imagen_portada: original.imagen_portada ?? null,
      fechas: original.evento_feria_fecha.map((f) => ({
        fecha: f.fecha,
        hora_inicio: f.hora_inicio,
        hora_fin: f.hora_fin,
        ubicacion: f.ubicacion,
        zona: f.zona,
      })),
      empresas: original.evento_feria_empresa.map((e) => e.empresa_id),
    });

    revalidateTag("ferias", "max");
    return nuevaFeria;
  },

  eliminarFeria: async (id: number) => {
    const feria = await FeriaModel.obtenerPorId(id);
    if (feria) {
      await borrarImagenFeria(feria.imagen_portada);
      for (const img of feria.evento_feria_imagen) {
        await borrarImagenFeria(img.url);
      }
    }

    await FeriaModel.eliminarRelaciones(id);
    await FeriaModel.eliminar(id);
    revalidateTag("ferias", "max");
  },
};
